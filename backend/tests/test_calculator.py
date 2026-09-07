"""
Unit test suite for the Financial Calculation Engine (backend/app/services/calculator.py).

Covers all 10 core calculation requirements:
1. One person
2. Two people
3. Everyone shares an item
4. Multiple people share one item
5. Different consumption amounts (Proportional GST & Service Charge)
6. Zero tax
7. Zero service charge
8. Discount
9. Rounding (1-2 paise remainder assigned to largest consumer)
10. Incorrect printed total validation
"""

import pytest
from app.models.bill import BillExtractionResponse, BillItem
from app.models.calculation import CalculationRequest, Person
from app.services.calculator import (
    to_paise,
    to_rupees,
    calculate_person_subtotals,
    calculate_tax_shares,
    calculate_service_charge_shares,
    calculate_discount_shares,
    calculate_final_amounts,
    validate_calculated_total,
    calculate_split,
)


def make_item(item_id: str, name: str, quantity: int, unit_price: float, total: float) -> BillItem:
    return BillItem(
        id=item_id,
        name=name,
        quantity=quantity,
        unit_price=unit_price,
        total=total,
        confidence=0.98,
    )


# -----------------------------------------------------------------------------
# 1. One Person Scenario
# -----------------------------------------------------------------------------
def test_one_person_takes_full_bill():
    items = [
        make_item("i1", "Butter Chicken", 1, 450.0, 450.0),
        make_item("i2", "Garlic Naan", 2, 60.0, 120.0),
    ]
    people = [Person(id="p1", name="Rahul")]
    assignments = {"i1": ["p1"], "i2": ["p1"]}

    subtotals, shares, unassigned, assigned_p, unassigned_p = calculate_person_subtotals(
        items, people, assignments
    )

    assert subtotals["p1"] == 57000  # ₹570.00 -> 57000 paise
    assert len(unassigned) == 0
    assert assigned_p == 57000

    tax_shares = calculate_tax_shares(subtotals, tax_rupees=28.50, total_consumed_paise=57000)
    service_shares = calculate_service_charge_shares(subtotals, service_charge_rupees=57.0, total_consumed_paise=57000)
    discount_shares = calculate_discount_shares(subtotals, discount_rupees=0.0, total_consumed_paise=57000)

    assert tax_shares["p1"] == 2850
    assert service_shares["p1"] == 5700

    final_amounts, discrepancy, total_sum = calculate_final_amounts(
        subtotals, tax_shares, service_shares, discount_shares, target_total_paise=65550
    )

    assert final_amounts["p1"] == 65550  # ₹655.50
    assert to_rupees(final_amounts["p1"]) == 655.50


# -----------------------------------------------------------------------------
# 2. Two People Scenario (Distinct Items)
# -----------------------------------------------------------------------------
def test_two_people_distinct_items():
    items = [
        make_item("i1", "Dosa", 1, 100.0, 100.0),
        make_item("i2", "Idli Platter", 1, 200.0, 200.0),
    ]
    people = [Person(id="p1", name="Rahul"), Person(id="p2", name="Ananya")]
    assignments = {"i1": ["p1"], "i2": ["p2"]}

    subtotals, _, _, _, _ = calculate_person_subtotals(items, people, assignments)
    assert subtotals["p1"] == 10000  # ₹100
    assert subtotals["p2"] == 20000  # ₹200

    # GST 5% = ₹15 total (p1: 100/300 * 15 = ₹5, p2: 200/300 * 15 = ₹10)
    tax_shares = calculate_tax_shares(subtotals, tax_rupees=15.0, total_consumed_paise=30000)
    assert tax_shares["p1"] == 500
    assert tax_shares["p2"] == 1000

    final_amounts, _, _ = calculate_final_amounts(
        subtotals, tax_shares, {"p1": 0, "p2": 0}, {"p1": 0, "p2": 0}, target_total_paise=31500
    )
    assert final_amounts["p1"] == 10500  # ₹105.00
    assert final_amounts["p2"] == 21000  # ₹210.00
    assert final_amounts["p1"] + final_amounts["p2"] == 31500


# -----------------------------------------------------------------------------
# 3. Everyone Shares an Item Scenario
# -----------------------------------------------------------------------------
def test_everyone_shares_an_item():
    items = [
        make_item("i1", "Nachos Platter", 1, 300.0, 300.0),
    ]
    people = [Person(id="p1", name="Rahul"), Person(id="p2", name="Ananya"), Person(id="p3", name="Rohan")]
    # Everyone = all 3 person IDs
    assignments = {"i1": ["p1", "p2", "p3"]}

    subtotals, shares, _, _, _ = calculate_person_subtotals(items, people, assignments)

    # ₹300 divided equally amongst 3 people = ₹100 each = 10000 paise each
    assert subtotals["p1"] == 10000
    assert subtotals["p2"] == 10000
    assert subtotals["p3"] == 10000

    tax_shares = calculate_tax_shares(subtotals, tax_rupees=15.0, total_consumed_paise=30000)
    assert tax_shares["p1"] == 500
    assert tax_shares["p2"] == 500
    assert tax_shares["p3"] == 500


# -----------------------------------------------------------------------------
# 4. Multiple People Share One Item (With Quantity)
# -----------------------------------------------------------------------------
def test_multiple_people_share_one_item_with_quantity():
    # Biryani qty=2, unit_price=₹240, total=₹480 shared by Rahul + Me
    items = [
        make_item("i1", "Biryani", 2, 240.0, 480.0),
    ]
    people = [Person(id="p1", name="Rahul"), Person(id="p2", name="Me")]
    assignments = {"i1": ["p1", "p2"]}

    subtotals, shares, _, _, _ = calculate_person_subtotals(items, people, assignments)

    # ₹480 / 2 = ₹240 = 24000 paise each
    assert subtotals["p1"] == 24000
    assert subtotals["p2"] == 24000
    assert shares["p1"][0].allocated_amount == 240.0
    assert shares["p2"][0].allocated_amount == 240.0


# -----------------------------------------------------------------------------
# 5. Different Consumption Amounts (Proportional GST & Service Charge)
# -----------------------------------------------------------------------------
def test_different_consumption_amounts_proportional_distribution():
    """
    User Specified Example:
    Rahul = ₹500 (50%)
    Ananya = ₹300 (30%)
    You = ₹200 (20%)
    Total consumed = ₹1000

    GST = ₹180 -> Rahul: ₹90, Ananya: ₹54, You: ₹36
    Service Charge = ₹100 -> Rahul: ₹50, Ananya: ₹30, You: ₹20
    Final amounts:
    Rahul: 500 + 90 + 50 = ₹640
    Ananya: 300 + 54 + 30 = ₹384
    You: 200 + 36 + 20 = ₹256
    Sum: 640 + 384 + 256 = ₹1280
    """
    items = [
        make_item("i1", "Rahul Item", 1, 500.0, 500.0),
        make_item("i2", "Ananya Item", 1, 300.0, 300.0),
        make_item("i3", "You Item", 1, 200.0, 200.0),
    ]
    people = [
        Person(id="p_rahul", name="Rahul"),
        Person(id="p_ananya", name="Ananya"),
        Person(id="p_you", name="You"),
    ]
    assignments = {
        "i1": ["p_rahul"],
        "i2": ["p_ananya"],
        "i3": ["p_you"],
    }

    subtotals, _, _, _, _ = calculate_person_subtotals(items, people, assignments)
    assert subtotals["p_rahul"] == 50000
    assert subtotals["p_ananya"] == 30000
    assert subtotals["p_you"] == 20000

    tax_shares = calculate_tax_shares(subtotals, tax_rupees=180.0, total_consumed_paise=100000)
    assert tax_shares["p_rahul"] == 9000  # ₹90
    assert tax_shares["p_ananya"] == 5400  # ₹54
    assert tax_shares["p_you"] == 3600  # ₹36

    service_shares = calculate_service_charge_shares(subtotals, service_charge_rupees=100.0, total_consumed_paise=100000)
    assert service_shares["p_rahul"] == 5000  # ₹50
    assert service_shares["p_ananya"] == 3000  # ₹30
    assert service_shares["p_you"] == 2000  # ₹20

    discount_shares = calculate_discount_shares(subtotals, discount_rupees=0.0, total_consumed_paise=100000)

    final_amounts, discrepancy, total_sum = calculate_final_amounts(
        subtotals, tax_shares, service_shares, discount_shares, target_total_paise=128000
    )

    assert final_amounts["p_rahul"] == 64000  # ₹640.00
    assert final_amounts["p_ananya"] == 38400  # ₹384.00
    assert final_amounts["p_you"] == 25600  # ₹256.00
    assert total_sum == 128000
    assert discrepancy == 0


# -----------------------------------------------------------------------------
# 6. Zero Tax Scenario
# -----------------------------------------------------------------------------
def test_zero_tax_scenario():
    items = [make_item("i1", "Coffee", 1, 150.0, 150.0)]
    people = [Person(id="p1", name="Rahul")]
    assignments = {"i1": ["p1"]}

    subtotals, _, _, _, _ = calculate_person_subtotals(items, people, assignments)
    tax_shares = calculate_tax_shares(subtotals, tax_rupees=0.0, total_consumed_paise=15000)
    assert tax_shares["p1"] == 0

    final_amounts, _, _ = calculate_final_amounts(
        subtotals, tax_shares, {"p1": 0}, {"p1": 0}, target_total_paise=15000
    )
    assert final_amounts["p1"] == 15000


# -----------------------------------------------------------------------------
# 7. Zero Service Charge Scenario
# -----------------------------------------------------------------------------
def test_zero_service_charge_scenario():
    items = [make_item("i1", "Tea", 1, 50.0, 50.0)]
    people = [Person(id="p1", name="Rahul")]
    assignments = {"i1": ["p1"]}

    subtotals, _, _, _, _ = calculate_person_subtotals(items, people, assignments)
    service_shares = calculate_service_charge_shares(subtotals, service_charge_rupees=0.0, total_consumed_paise=5000)
    assert service_shares["p1"] == 0


# -----------------------------------------------------------------------------
# 8. Discount Scenario (Proportional Discount Deduction)
# -----------------------------------------------------------------------------
def test_discount_proportional_deduction():
    # Rahul ₹600 (60%), Ananya ₹400 (40%), Total ₹1000. Discount ₹100.
    items = [
        make_item("i1", "Item 1", 1, 600.0, 600.0),
        make_item("i2", "Item 2", 1, 400.0, 400.0),
    ]
    people = [Person(id="p1", name="Rahul"), Person(id="p2", name="Ananya")]
    assignments = {"i1": ["p1"], "i2": ["p2"]}

    subtotals, _, _, _, _ = calculate_person_subtotals(items, people, assignments)
    discount_shares = calculate_discount_shares(subtotals, discount_rupees=100.0, total_consumed_paise=100000)

    # Rahul discount = 60% of ₹100 = ₹60 (6000 paise)
    # Ananya discount = 40% of ₹100 = ₹40 (4000 paise)
    assert discount_shares["p1"] == 6000
    assert discount_shares["p2"] == 4000

    # Net payable = (600 - 60) + (400 - 40) = 540 + 360 = 900
    final_amounts, _, _ = calculate_final_amounts(
        subtotals, {"p1": 0, "p2": 0}, {"p1": 0, "p2": 0}, discount_shares, target_total_paise=90000
    )
    assert final_amounts["p1"] == 54000
    assert final_amounts["p2"] == 36000
    assert final_amounts["p1"] + final_amounts["p2"] == 90000


# -----------------------------------------------------------------------------
# 9. Rounding Scenario (1-2 Paise Discrepancy Allocation to Largest Consumer)
# -----------------------------------------------------------------------------
def test_rounding_assigns_paise_remainder_to_largest_consumer():
    """
    3 people split items where tax causes recurring fractions:
    Rahul: ₹100 (subtotal 10000 paise) - Largest consumer
    Ananya: ₹50 (subtotal 5000 paise)
    You: ₹50 (subtotal 5000 paise)
    Total = ₹200 (20000 paise)

    Tax = ₹0.07 (7 paise total).
    Rahul ratio 50% -> 3.5 paise -> rounds to 4 paise
    Ananya ratio 25% -> 1.75 paise -> rounds to 2 paise
    You ratio 25% -> 1.75 paise -> rounds to 2 paise
    Sum of raw tax = 4 + 2 + 2 = 8 paise (1 paisa excess!).

    The reconcile step detects target = 20007 paise, current sum = 20008 paise.
    Discrepancy = -1 paisa.
    Largest consumer (Rahul) receives the -1 paisa adjustment so total = 20007 paise exactly.
    """
    items = [
        make_item("i1", "Item A", 1, 100.0, 100.0),
        make_item("i2", "Item B", 1, 50.0, 50.0),
        make_item("i3", "Item C", 1, 50.0, 50.0),
    ]
    people = [
        Person(id="p_rahul", name="Rahul"),
        Person(id="p_ananya", name="Ananya"),
        Person(id="p_you", name="You"),
    ]
    assignments = {"i1": ["p_rahul"], "i2": ["p_ananya"], "i3": ["p_you"]}

    subtotals, _, _, _, _ = calculate_person_subtotals(items, people, assignments)
    tax_shares = calculate_tax_shares(subtotals, tax_rupees=0.07, total_consumed_paise=20000)

    # 100.00 + 50.00 + 50.00 + 0.07 = ₹200.07 (20007 paise)
    final_amounts, discrepancy, total_sum = calculate_final_amounts(
        subtotals, tax_shares, {"p_rahul": 0, "p_ananya": 0, "p_you": 0}, {"p_rahul": 0, "p_ananya": 0, "p_you": 0},
        target_total_paise=20007
    )

    # Check that sum matches target precisely
    assert final_amounts["p_rahul"] + final_amounts["p_ananya"] + final_amounts["p_you"] == 20007
    # Rahul absorbed the 1 paisa rounding difference
    assert final_amounts["p_rahul"] == 10003  # 10000 subtotal + 4 tax - 1 adjustment
    assert final_amounts["p_ananya"] == 5002  # 5000 subtotal + 2 tax
    assert final_amounts["p_you"] == 5002  # 5000 subtotal + 2 tax


# -----------------------------------------------------------------------------
# 10. Incorrect Printed Total Validation
# -----------------------------------------------------------------------------
def test_incorrect_printed_total_validation():
    """
    Tests validate_calculated_total when printed total on the bill does not match
    items + tax - discount.
    """
    # Subtotal 500 + Tax 50 = 550, but printed total says 600 (difference of 50)
    val = validate_calculated_total(
        computed_total_paise=55000,
        printed_total_rupees=600.0,
        subtotal_paise=50000,
        tax_paise=5000,
        service_paise=0,
        discount_paise=0,
    )

    assert val["is_valid"] is False
    assert val["difference_rupees"] == 50.0
    assert "Printed total ₹600.00 does not match" in val["warning_message"]

    # When total matches
    val_correct = validate_calculated_total(
        computed_total_paise=55000,
        printed_total_rupees=550.0,
        subtotal_paise=50000,
        tax_paise=5000,
        service_paise=0,
        discount_paise=0,
    )
    assert val_correct["is_valid"] is True
    assert val_correct["difference_rupees"] == 0.0
    assert val_correct["warning_message"] is None


# -----------------------------------------------------------------------------
# Full Pipeline Test via calculate_split
# -----------------------------------------------------------------------------
def test_full_pipeline_calculate_split():
    bill_data = BillExtractionResponse(
        restaurant_name="Punjab Grill",
        currency="INR",
        items=[
            make_item("i1", "Murgh Tikka", 1, 450.0, 450.0),
            make_item("i2", "Dal Makhani", 1, 350.0, 350.0),
            make_item("i3", "Butter Naan", 4, 60.0, 240.0),
        ],
        subtotal=1040.0,
        tax=52.0,  # 5% GST
        service_charge=104.0,  # 10% Service Charge
        discount=100.0,  # ₹100 Flat discount
        total=1096.0,  # 1040 + 52 + 104 - 100 = 1096.0
        confidence=0.95,
    )

    req = CalculationRequest(
        bill=bill_data,
        people=[
            Person(id="p1", name="Rahul"),
            Person(id="p2", name="Ananya"),
        ],
        assignments={
            "i1": ["p1"],  # 450 Rahul
            "i2": ["p2"],  # 350 Ananya
            "i3": ["p1", "p2"],  # 240 split -> 120 each
        },
    )

    resp = calculate_split(req)

    # Rahul subtotal = 450 + 120 = 570
    # Ananya subtotal = 350 + 120 = 470
    # Total consumed = 1040
    p1_calc = next(p for p in resp.people_calculations if p.person_id == "p1")
    p2_calc = next(p for p in resp.people_calculations if p.person_id == "p2")

    assert p1_calc.items_subtotal == 570.0
    assert p2_calc.items_subtotal == 470.0

    # Total of all splits must equal 1096.0
    assert round(p1_calc.total_amount + p2_calc.total_amount, 2) == 1096.0
    assert resp.summary.grand_total == 1096.0
    assert resp.summary.discrepancy == 0.0
