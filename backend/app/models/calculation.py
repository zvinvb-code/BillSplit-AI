from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from app.models.bill import BillExtractionResponse


class Person(BaseModel):
    id: str = Field(..., description="Unique ID for the person")
    name: str = Field(..., min_length=1, description="Display name of the person")
    color: Optional[str] = Field(default=None, description="Hex color or color name for UI badge")


class CalculationRequest(BaseModel):
    bill: BillExtractionResponse = Field(..., description="The reviewed and confirmed bill data")
    people: List[Person] = Field(..., min_length=1, description="List of people participating in the split")
    assignments: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Map of item_id -> list of person_ids sharing this item"
    )
    tax_split_method: str = Field(
        default="proportional",
        description="'proportional' (fairest, proportional to items consumed) or 'equal' (divided equally)"
    )


class PersonItemShare(BaseModel):
    item_id: str
    name: str
    unit_price: float
    quantity: float
    share_fraction: float
    share_amount: float

    @property
    def allocated_amount(self) -> float:
        return self.share_amount



class PersonCalculation(BaseModel):
    person_id: str
    name: str
    color: Optional[str] = None
    items: List[PersonItemShare] = Field(default_factory=list)
    items_subtotal: float = Field(..., description="Subtotal of items consumed by this person")
    tax_share: float = Field(..., description="Proportional GST/tax assigned to this person")
    service_charge_share: float = Field(..., description="Proportional service charge assigned to this person")
    discount_share: float = Field(..., description="Proportional discount deducted for this person")
    total_amount: float = Field(..., description="Final net amount this person owes (₹)")
    percentage_of_bill: float = Field(..., description="Percentage of total bill (0-100%)")


class CalculationSummary(BaseModel):
    currency: str = "₹"
    bill_subtotal: float
    assigned_subtotal: float
    unassigned_subtotal: float
    total_tax: float
    total_service_charge: float
    total_discount: float
    grand_total: float
    calculated_total_sum: float
    discrepancy: float = Field(
        default=0.0,
        description="Difference between grand_total and sum of people totals (0.00 if reconciled)"
    )
    unassigned_items: List[str] = Field(
        default_factory=list,
        description="List of item names that were not assigned to anyone"
    )


class CalculationResponse(BaseModel):
    people_calculations: List[PersonCalculation]
    summary: CalculationSummary
