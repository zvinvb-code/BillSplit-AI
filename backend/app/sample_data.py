from typing import Dict
from app.models.bill import BillExtractionResponse, BillItem

SAMPLE_BILLS: Dict[str, BillExtractionResponse] = {
    "punjab_grill": BillExtractionResponse(
        restaurant_name="Punjab Grill & Bar",
        currency="INR",
        items=[
            BillItem(id="item_1", name="Butter Chicken", quantity=1.0, unit_price=580.0, total=580.0, confidence=0.98),
            BillItem(id="item_2", name="Paneer Butter Masala", quantity=1.0, unit_price=480.0, total=480.0, confidence=0.97),
            BillItem(id="item_3", name="Dal Makhani", quantity=1.0, unit_price=420.0, total=420.0, confidence=0.99),
            BillItem(id="item_4", name="Butter Garlic Naan", quantity=4.0, unit_price=90.0, total=360.0, confidence=0.95),
            BillItem(id="item_5", name="Jeera Rice", quantity=2.0, unit_price=210.0, total=420.0, confidence=0.96),
            BillItem(id="item_6", name="Fresh Lime Soda", quantity=3.0, unit_price=140.0, total=420.0, confidence=0.94),
            BillItem(id="item_7", name="Gulab Jamun with Ice Cream", quantity=2.0, unit_price=180.0, total=360.0, confidence=0.96),
        ],
        subtotal=3040.0,
        tax=152.0,  # 5% GST (2.5% CGST + 2.5% SGST)
        service_charge=152.0,  # 5% Service charge
        discount=200.0,  # Zomato Gold / Privilege discount
        total=3144.0,
        field_confidence={
            "subtotal": 0.99,
            "tax": 0.96,
            "service_charge": 0.94,
            "total": 0.99,
        },
        is_fallback=True,
        extractor_provider="mock",
        notes="Dinner at Punjab Grill, Bandra Kurla Complex. GST @ 5% applied.",
    ),
    "social_cafe": BillExtractionResponse(
        restaurant_name="Social Cafe & Lounge",
        currency="INR",
        items=[
            BillItem(id="item_1", name="Loaded Nachos Grande", quantity=1.0, unit_price=395.0, total=395.0, confidence=0.98),
            BillItem(id="item_2", name="Peri Peri Chicken Tikka", quantity=2.0, unit_price=440.0, total=880.0, confidence=0.96),
            BillItem(id="item_3", name="Truffle Mushroom Pasta", quantity=1.0, unit_price=495.0, total=495.0, confidence=0.95),
            BillItem(id="item_4", name="Classic Margherita Pizza", quantity=1.0, unit_price=480.0, total=480.0, confidence=0.97),
            BillItem(id="item_5", name="LIIT Pitcher", quantity=1.0, unit_price=1250.0, total=1250.0, confidence=0.99),
            BillItem(id="item_6", name="Virgin Mojito", quantity=2.0, unit_price=220.0, total=440.0, confidence=0.94),
        ],
        subtotal=3940.0,
        tax=197.0,  # 5% GST
        service_charge=394.0,  # 10% Service Charge
        discount=0.0,
        total=4531.0,
        field_confidence={
            "subtotal": 0.98,
            "tax": 0.96,
            "service_charge": 0.95,
            "total": 0.99,
        },
        is_fallback=True,
        extractor_provider="mock",
        notes="Social Indiranagar, Bangalore. Saturday Night bill.",
    ),
    "saravana_bhavan": BillExtractionResponse(
        restaurant_name="Saravana Bhavan",
        currency="INR",
        items=[
            BillItem(id="item_1", name="Special Ghee Masala Dosa", quantity=2.0, unit_price=160.0, total=320.0, confidence=0.99),
            BillItem(id="item_2", name="Idli Vada Combo", quantity=2.0, unit_price=120.0, total=240.0, confidence=0.98),
            BillItem(id="item_3", name="Rava Kesari", quantity=1.0, unit_price=90.0, total=90.0, confidence=0.97),
            BillItem(id="item_4", name="Filter Coffee", quantity=3.0, unit_price=60.0, total=180.0, confidence=0.99),
        ],
        subtotal=830.0,
        tax=41.50,  # 5% GST
        service_charge=0.0,
        discount=0.0,
        total=871.50,
        field_confidence={
            "subtotal": 0.99,
            "tax": 0.98,
            "service_charge": 1.0,
            "total": 0.99,
        },
        is_fallback=True,
        extractor_provider="mock",
        notes="Connaught Place, New Delhi. Sunday morning breakfast.",
    ),
}
