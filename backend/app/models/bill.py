from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class BillItem(BaseModel):
    id: str = Field(..., description="Unique identifier for the line item")
    name: str = Field(..., description="Name of the food/drink item")
    quantity: float = Field(default=1.0, ge=0.01, description="Quantity ordered")
    unit_price: float = Field(..., ge=0.0, description="Price per single unit")
    total: float = Field(..., ge=0.0, description="Total price for this line item")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0, description="Confidence score for this line item (0.0 to 1.0)")


class BillConfidence(BaseModel):
    subtotal: float = Field(default=0.98, ge=0.0, le=1.0)
    tax: float = Field(default=0.95, ge=0.0, le=1.0)
    service_charge: float = Field(default=0.92, ge=0.0, le=1.0)
    total: float = Field(default=0.99, ge=0.0, le=1.0)


class BillExtractionResponse(BaseModel):
    restaurant_name: Optional[str] = Field(default=None, description="Name of restaurant/establishment if detected")
    currency: str = Field(default="INR", description="Currency symbol or code (e.g. INR, ₹, USD, EUR)")
    items: List[BillItem] = Field(default_factory=list, description="List of extracted food/drink line items")
    subtotal: Optional[float] = Field(default=None, description="Printed pre-tax subtotal if available, else null")
    tax: Optional[float] = Field(default=None, description="Printed taxes (GST, CGST+SGST, VAT) if available, else null")
    service_charge: Optional[float] = Field(default=None, description="Printed service charge or tip if available, else null")
    discount: Optional[float] = Field(default=None, description="Printed discount if available, else null")
    total: Optional[float] = Field(default=None, description="Printed grand total if available, else null")
    field_confidence: Dict[str, Optional[float]] = Field(
        default_factory=lambda: {
            "subtotal": 0.98,
            "tax": 0.95,
            "service_charge": 0.92,
            "total": 0.99,
        },
        description="Confidence scores for individual summary fields"
    )

    # Transparency flags for demo & fallback indication
    is_fallback: bool = Field(default=False, description="True if fallback demo data is being returned")
    fallback_reason: Optional[str] = Field(default=None, description="Detailed reason why fallback data is used (e.g., missing API key or provider failure)")
    extractor_provider: str = Field(default="mock", description="Provider used: 'vision' or 'mock'")
    notes: Optional[str] = Field(default=None, description="Additional context or notes from extraction")
