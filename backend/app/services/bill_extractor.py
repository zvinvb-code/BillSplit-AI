"""
BillExtractor abstraction service using Google GenAI SDK and Gemini 2.5 Flash.
"""

import io
import json
import logging
from typing import Optional, Dict, Any
from PIL import Image

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config import settings
from app.models.bill import BillExtractionResponse, BillItem, BillConfidence

logger = logging.getLogger("bill_extractor")

SYSTEM_EXTRACTION_PROMPT = """You are a restaurant bill extraction system.

Analyze the supplied restaurant bill image carefully.

The image may contain:
- dim lighting
- shadows
- perspective distortion
- crumpled paper
- faded thermal printing
- handwriting
- multiple scripts/languages
- poor image quality
- long receipts
- partial receipt photographs

Extract ONLY information that is visually supported by the
bill.

Do not invent missing values.

Read all visible line items.

For each item return:
- name
- quantity
- unit_price
- total
- confidence

Also extract:
- restaurant_name
- currency
- subtotal
- tax
- service_charge
- discount
- printed_total

Return null if a field cannot be determined.

Preserve the printed values exactly.

Do not calculate a total yourself if a printed total exists.

The application will perform financial calculations separately.

Return valid JSON matching the Pydantic schema."""


class RawExtractedItem(BaseModel):
    name: str = Field(..., description="Exact name of the item")
    quantity: float = Field(default=1.0, ge=0.01, description="Quantity ordered")
    unit_price: float = Field(default=0.0, ge=0.0, description="Unit price per item")
    total: float = Field(default=0.0, ge=0.0, description="Total amount for this line item")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0, description="OCR confidence score (0.0 to 1.0)")


class RawBillExtraction(BaseModel):
    restaurant_name: Optional[str] = Field(default=None, description="Name of restaurant or establishment")
    currency: str = Field(default="INR", description="Currency symbol or code (e.g. INR, ₹, USD, EUR)")
    items: list[RawExtractedItem] = Field(default_factory=list, description="Extracted line items")
    subtotal: Optional[float] = Field(default=None, description="Printed pre-tax subtotal if legible")
    tax: Optional[float] = Field(default=None, description="Printed taxes (GST, CGST+SGST, VAT) if legible")
    service_charge: Optional[float] = Field(default=None, description="Printed service charge or tip if legible")
    discount: Optional[float] = Field(default=None, description="Printed promotional discount if legible")
    printed_total: Optional[float] = Field(default=None, description="Printed grand total if legible")


class BillExtractor:
    """
    Clean BillExtractor abstraction wrapping the Google GenAI SDK for Gemini 2.5 Flash vision.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-2.5-flash"

        if not self.api_key:
            raise ValueError(
                "Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env"
            )

        self.client = genai.Client(api_key=self.api_key)

    def extract(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        mime_type: str = "image/jpeg",
    ) -> BillExtractionResponse:
        """
        Processes a restaurant bill image through the image preprocessor and Gemini Vision API.
        Validates structured JSON response with Pydantic.
        """
        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Uploaded image file is empty.")

        # 1. Execute Image Preprocessing Pipeline
        # Generates enhanced copy (EXIF orientation, RGB, aspect-ratio scaling, contrast/sharpness)
        # while leaving original image untouched for UI review display.
        from app.services.image_preprocessor import preprocess_bill_image

        try:
            prep_result = preprocess_bill_image(
                image_bytes=image_bytes,
                mime_type=mime_type,
                max_dimension=2048,
                enhance_contrast=True,
                enhance_sharpness=True,
            )
        except Exception as img_err:
            raise ValueError(f"Invalid or corrupted image file: {img_err}") from img_err

        # 2. Call Gemini Vision model with enhanced analysis image copy
        logger.info(
            f"Calling Gemini model '{self.model_name}' with preprocessed analysis image "
            f"({prep_result.analysis_width}x{prep_result.analysis_height}, resized={prep_result.was_resized})..."
        )
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(data=prep_result.analysis_bytes, mime_type=prep_result.mime_type),
                    SYSTEM_EXTRACTION_PROMPT,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.0,
                ),
            )

        except Exception as e:
            if ("404" in str(e) or "NOT_FOUND" in str(e)) and self.model_name != "gemini-3.6-flash":
                fallback_model = "gemini-3.6-flash"
                logger.warning(f"Model '{self.model_name}' unavailable ({e}). Retrying with '{fallback_model}'...")
                response = self.client.models.generate_content(
                    model=fallback_model,
                    contents=[
                        types.Part.from_bytes(data=prep_result.analysis_bytes, mime_type=prep_result.mime_type),
                        SYSTEM_EXTRACTION_PROMPT,
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.0,
                    ),
                )
            else:
                raise


        response_text = (response.text or "").strip()
        if not response_text:
            raise ValueError("Gemini 2.5 Flash returned an empty response.")

        # Clean JSON fences if returned
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        # 3. Parse JSON & Validate via Pydantic
        raw_dict = json.loads(response_text.strip())
        raw_extraction = RawBillExtraction.model_validate(raw_dict)

        # 4. Map into domain BillExtractionResponse
        domain_items = []
        for idx, item in enumerate(raw_extraction.items):
            domain_items.append(
                BillItem(
                    id=f"item_{idx + 1}",
                    name=item.name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total=item.total if item.total > 0 else round(item.quantity * item.unit_price, 2),
                    confidence=min(1.0, max(0.0, item.confidence)),
                )
            )

        field_conf = {
            "subtotal": 0.98 if raw_extraction.subtotal is not None else 0.50,
            "tax": 0.95 if raw_extraction.tax is not None else 0.50,
            "service_charge": 0.92 if raw_extraction.service_charge is not None else 0.50,
            "total": 0.99 if raw_extraction.printed_total is not None else 0.50,
        }

        return BillExtractionResponse(
            restaurant_name=raw_extraction.restaurant_name,
            currency=raw_extraction.currency or "INR",
            items=domain_items,
            subtotal=raw_extraction.subtotal,
            tax=raw_extraction.tax,
            service_charge=raw_extraction.service_charge,
            discount=raw_extraction.discount,
            total=raw_extraction.printed_total,
            field_confidence=field_conf,
            is_fallback=False,
            fallback_reason=None,
            extractor_provider=f"gemini_vision ({self.model_name})",
            notes=f"Extracted live via Google GenAI SDK using model {self.model_name}.",
        )
