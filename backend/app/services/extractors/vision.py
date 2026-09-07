import io
import json
import logging
from typing import Optional, Dict, Any
from PIL import Image

from app.config import settings
from app.models.bill import BillExtractionResponse, BillItem
from app.services.extractors.base import BillExtractor


logger = logging.getLogger("vision_extractor")

VISION_PROMPT = """
You are a precision restaurant bill and receipt parser.

TASK:
Analyze the provided bill/receipt image and extract structured data following these STRICT RULES:

1. Read the entire bill thoroughly from top to bottom.
2. Preserve quantities: if 2 items are ordered, quantity must be 2. If quantity is not explicitly printed, assume 1.
3. Distinguish unit price from line total:
   - 'unit_price' is the price per single item.
   - 'total' is the full line total for that item (quantity * unit_price).
4. Identify taxes: identify any printed taxes (such as GST, CGST, SGST, Sales Tax, VAT). If multiple taxes are listed, sum them into the single 'tax' field.
5. Identify service charge: identify any printed service charge or gratuity.
6. Identify discounts: identify any promotional discounts, voucher deductions, or membership discounts.
7. Identify printed total: identify the final grand total printed on the receipt.
8. DO NOT calculate missing values: If a tax, subtotal, discount, or service charge is NOT printed on the bill, return null. Do NOT attempt to calculate or infer them.
9. Return null when information is unavailable: If the restaurant name or any total is obscured or not present, set it to null.
10. NEVER invent a value: Only extract what is clearly legible on the image.

Output MUST be strictly valid JSON matching this exact structure:
{
  "restaurant_name": "string or null",
  "currency": "INR", // or detected currency symbol/code (e.g. INR, ₹, USD)
  "items": [
    {
      "id": "item_1",
      "name": "Exact item name",
      "quantity": 1.0,
      "unit_price": 100.0,
      "total": 100.0,
      "confidence": 0.95
    }
  ],
  "subtotal": 1000.0, // float or null if not printed
  "tax": 180.0,       // float or null if not printed
  "service_charge": 50.0, // float or null if not printed
  "discount": 0.0,    // float or null if not printed
  "total": 1230.0,    // float or null if not printed
  "field_confidence": {
      "subtotal": 0.99,
      "tax": 0.95,
      "service_charge": 0.92,
      "total": 0.99
  }
}
"""


class VisionBillExtractor(BillExtractor):
    """
    Vision-capable LLM bill extractor powered by Google Gemini 2.5 Flash.
    Delegates to app.services.bill_extractor.BillExtractor for structured Pydantic extraction.
    """

    def __init__(self, api_key: str, model_name: Optional[str] = None):
        if not api_key:
            raise ValueError("VisionBillExtractor requires a valid non-empty API key.")
        self._api_key = api_key
        self._model_name = model_name or settings.GEMINI_MODEL or "gemini-2.5-flash"

    @property
    def provider_name(self) -> str:
        return f"vision ({self._model_name})"

    def extract(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        mime_type: str = "image/jpeg",
    ) -> BillExtractionResponse:
        from app.services.bill_extractor import BillExtractor as BackendBillExtractor

        extractor = BackendBillExtractor(api_key=self._api_key, model_name=self._model_name)
        return extractor.extract(image_bytes=image_bytes, filename=filename, mime_type=mime_type)

