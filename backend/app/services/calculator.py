"""
Authoritative Financial Calculation Engine for BillSplit AI.

Implements integer paise arithmetic (1 INR = 100 paise) to eliminate
floating-point money rounding errors. Proportional distribution ensures
that taxes, service charges, and discounts are distributed according
to each participant's actual food consumption ratio.
"""

from typing import List, Dict, Tuple, Optional
from app.models.bill import BillExtractionResponse, BillItem
from app.models.calculation import (
    Person,
    CalculationRequest,
    PersonItemShare,
    PersonCalculation,
    CalculationSummary,
    CalculationResponse,
)


def to_paise(rupees: Optional[float]) -> int:
    """Converts a rupee amount (float or int) into integer paise to avoid float errors."""
    if rupees is None:
        return 0
    return int(round(float(rupees) * 100))


def to_rupees(paise: int) -> float:
    """Converts integer paise back into standard rupees (float rounded to 2 decimals)."""
    return round(paise / 100.0, 2)


def calculate_person_subtotals(
    items: List[BillItem],
    people: List[Person],
    assignments: Dict[str, List[str]],
) -> Tuple[Dict[str, int], Dict[str, List[PersonItemShare]], List[str], int, int]:
    """
    STEP 1: Calculate each person's raw food item subtotal in integer paise.

    Divides shared items equally among the people assigned to that item.
    Correctly supports item quantity and unit prices.

    Returns:
        (person_subtotals_paise, person_shares_list, unassigned_items, assigned_paise, unassigned_paise)
    """
    people_dict = {p.id: p for p in people}
    person_subtotals: Dict[str, int] = {p.id: 0 for p in people}
    person_shares: Dict[str, List[PersonItemShare]] = {p.id: [] for p in people}

    unassigned_items: List[str] = []
    unassigned_paise = 0
    assigned_paise = 0

    for item in items:
        assigned_ids = [pid for pid in assignments.get(item.id, []) if pid in people_dict]
        num_assigned = len(assigned_ids)

        item_total_paise = to_paise(item.total)

        if num_assigned == 0:
            unassigned_items.append(item.name)
            unassigned_paise += item_total_paise
            continue

        assigned_paise += item_total_paise
        fraction = 1.0 / num_assigned

        # Integer division of paise per person
        share_paise_per_person = int(round(item_total_paise / num_assigned))

        for pid in assigned_ids:
            share = PersonItemShare(
                item_id=item.id,
                name=item.name,
                unit_price=item.unit_price,
                quantity=round(item.quantity * fraction, 2),
                share_fraction=round(fraction, 4),
                share_amount=to_rupees(share_paise_per_person),
            )
            person_shares[pid].append(share)
            person_subtotals[pid] += share_paise_per_person

    return person_subtotals, person_shares, unassigned_items, assigned_paise, unassigned_paise


class ValidationResult(dict):
    """Dict subclass supporting tuple unpacking (is_valid, diff) and key access."""
    def __getitem__(self, key):
        if isinstance(key, int):
            if key == 0:
                return self["is_valid"]
            elif key == 1:
                return self.get("difference_rupees", 0.0)
        return super().__getitem__(key)

    def __iter__(self):
        yield self["is_valid"]
        yield self.get("difference_rupees", 0.0)


def calculate_tax_shares(
    person_subtotals: Dict[str, int],
    total_tax_rupees: Optional[float] = None,
    total_consumed_paise: int = 0,
    method: str = "proportional",
    tax_rupees: Optional[float] = None,
) -> Dict[str, int]:
    """
    STEP 3: Distribute tax proportionally in integer paise according to consumption ratio.

    Rahul (500/1000 = 50%) -> 50% of GST
    Ananya (300/1000 = 30%) -> 30% of GST
    You (200/1000 = 20%) -> 20% of GST
    """
    effective_tax = total_tax_rupees if total_tax_rupees is not None else tax_rupees
    total_tax_paise = to_paise(effective_tax)
    if total_tax_paise <= 0 or not person_subtotals:
        return {pid: 0 for pid in person_subtotals}

    num_people = len(person_subtotals)
    tax_shares: Dict[str, int] = {}

    for pid, sub_paise in person_subtotals.items():
        if method == "equal" or total_consumed_paise <= 0:
            tax_shares[pid] = int(round(total_tax_paise / num_people))
        else:
            # Strictly proportional to food items subtotal consumed
            ratio = sub_paise / total_consumed_paise
            tax_shares[pid] = int(round(total_tax_paise * ratio))

    return tax_shares


def calculate_service_charge_shares(
    person_subtotals: Dict[str, int],
    total_service_rupees: Optional[float] = None,
    total_consumed_paise: int = 0,
    method: str = "proportional",
    service_charge_rupees: Optional[float] = None,
) -> Dict[str, int]:
    """
    STEP 4: Distribute service charge proportionally in integer paise.
    """
    effective_sc = total_service_rupees if total_service_rupees is not None else service_charge_rupees
    total_sc_paise = to_paise(effective_sc)
    if total_sc_paise <= 0 or not person_subtotals:
        return {pid: 0 for pid in person_subtotals}

    num_people = len(person_subtotals)
    sc_shares: Dict[str, int] = {}

    for pid, sub_paise in person_subtotals.items():
        if method == "equal" or total_consumed_paise <= 0:
            sc_shares[pid] = int(round(total_sc_paise / num_people))
        else:
            ratio = sub_paise / total_consumed_paise
            sc_shares[pid] = int(round(total_sc_paise * ratio))

    return sc_shares


def calculate_discount_shares(
    person_subtotals: Dict[str, int],
    total_discount_rupees: Optional[float] = None,
    total_consumed_paise: int = 0,
    method: str = "proportional",
    discount_rupees: Optional[float] = None,
) -> Dict[str, int]:
    """
    Distribute promotional discounts proportionally in integer paise.
    """
    effective_discount = total_discount_rupees if total_discount_rupees is not None else discount_rupees
    total_discount_paise = to_paise(effective_discount)
    if total_discount_paise <= 0 or not person_subtotals:
        return {pid: 0 for pid in person_subtotals}

    num_people = len(person_subtotals)
    discount_shares: Dict[str, int] = {}

    for pid, sub_paise in person_subtotals.items():
        if method == "equal" or total_consumed_paise <= 0:
            discount_shares[pid] = int(round(total_discount_paise / num_people))
        else:
            ratio = sub_paise / total_consumed_paise
            discount_shares[pid] = int(round(total_discount_paise * ratio))

    return discount_shares


def calculate_final_amounts(
    person_subtotals: Dict[str, int],
    tax_shares: Dict[str, int],
    service_shares: Dict[str, int],
    discount_shares: Dict[str, int],
    target_total_paise: Optional[int] = None,
) -> Tuple[Dict[str, int], int, int]:
    """
    STEP 5: Final amount per person in integer paise:
    person_subtotal + proportional_tax + proportional_service - proportional_discount

    REMAINDER RECONCILIATION POLICY:
    Due to division rounding at the single paise level, sum(final_amounts) may
    occasionally differ from target_total by 1–2 paise (e.g. ₹100 split 3 ways is
    33.33 + 33.33 + 33.33 = 99.99, leaving 1 paise).
    Standard accounting convention dictates assigning this 1–2 paise remainder to the
    participant with the largest subtotal (who consumed the most food), ensuring the
    sum of all participant totals strictly equals the bill's grand total.

    Returns: (final_amounts, discrepancy_paise, current_sum_paise)
    """
    final_amounts: Dict[str, int] = {}

    for pid in person_subtotals:
        sub = person_subtotals[pid]
        t = tax_shares.get(pid, 0)
        s = service_shares.get(pid, 0)
        d = discount_shares.get(pid, 0)
        final_amounts[pid] = max(0, sub + t + s - d)

    current_sum_paise = sum(final_amounts.values())

    # Reconcile rounding remainder (typically +/- 1 or 2 paise) if target total is provided
    discrepancy_paise = 0
    if target_total_paise is not None:
        discrepancy_paise = target_total_paise - current_sum_paise
        if abs(discrepancy_paise) in [1, 2] and person_subtotals:
            # Assign remainder paise to the participant with the largest subtotal
            largest_consumer_pid = max(person_subtotals.keys(), key=lambda k: person_subtotals[k])
            final_amounts[largest_consumer_pid] += discrepancy_paise
            current_sum_paise = sum(final_amounts.values())
            discrepancy_paise = target_total_paise - current_sum_paise

    return final_amounts, discrepancy_paise, current_sum_paise


def validate_calculated_total(
    final_amounts_rupees: Optional[Dict[str, float]] = None,
    target_total_rupees: Optional[float] = None,
    computed_total_paise: Optional[int] = None,
    printed_total_rupees: Optional[float] = None,
    subtotal_paise: int = 0,
    tax_paise: int = 0,
    service_paise: int = 0,
    discount_paise: int = 0,
) -> ValidationResult:
    """
    Validates whether sum(final_amounts) strictly equals the printed grand total.
    Detects discrepancies and incorrect printed totals.
    """
    if computed_total_paise is not None and printed_total_rupees is not None:
        computed_rupees = to_rupees(computed_total_paise)
        diff = round(printed_total_rupees - computed_rupees, 2)
        is_valid = abs(diff) < 0.01
        warning = None if is_valid else f"Printed total ₹{printed_total_rupees:.2f} does not match computed sum ₹{computed_rupees:.2f}."
        return ValidationResult({
            "is_valid": is_valid,
            "difference_rupees": diff,
            "warning_message": warning,
        })

    calc_sum = round(sum(final_amounts_rupees.values()), 2) if final_amounts_rupees else 0.0
    target = target_total_rupees if target_total_rupees is not None else 0.0
    diff = round(target - calc_sum, 2)
    is_valid = abs(diff) < 0.01
    warning = None if is_valid else f"Target total ₹{target:.2f} does not match calculated sum ₹{calc_sum:.2f}."
    return ValidationResult({
        "is_valid": is_valid,
        "difference_rupees": diff,
        "warning_message": warning,
    })


def calculate_split(request: CalculationRequest) -> CalculationResponse:
    """
    Authoritative backend endpoint logic orchestrating pure calculation functions.
    """
    bill = request.bill
    people = request.people
    assignments = request.assignments
    method = request.tax_split_method.lower()

    # 1. Person Subtotals
    person_subtotals_paise, person_shares, unassigned_items, assigned_paise, unassigned_paise = (
        calculate_person_subtotals(bill.items, people, assignments)
    )

    total_consumed_paise = sum(person_subtotals_paise.values())

    # 2. Tax Shares
    tax_shares_paise = calculate_tax_shares(
        person_subtotals=person_subtotals_paise,
        total_tax_rupees=bill.tax,
        total_consumed_paise=total_consumed_paise,
        method=method,
    )

    # 3. Service Charge Shares
    service_shares_paise = calculate_service_charge_shares(
        person_subtotals=person_subtotals_paise,
        total_service_rupees=bill.service_charge,
        total_consumed_paise=total_consumed_paise,
        method=method,
    )

    # 4. Discount Shares
    discount_shares_paise = calculate_discount_shares(
        person_subtotals=person_subtotals_paise,
        total_discount_rupees=bill.discount,
        total_consumed_paise=total_consumed_paise,
        method=method,
    )

    # Determine target grand total in paise
    bill_subtotal_paise = to_paise(bill.subtotal) if bill.subtotal is not None else (assigned_paise + unassigned_paise)
    bill_tax_paise = to_paise(bill.tax)
    bill_service_paise = to_paise(bill.service_charge)
    bill_discount_paise = to_paise(bill.discount)

    if bill.total is not None:
        target_total_paise = to_paise(bill.total)
    else:
        target_total_paise = bill_subtotal_paise + bill_tax_paise + bill_service_paise - bill_discount_paise

    # If no items are unassigned, use target_total_paise for 1-2 paise remainder reconciliation
    reconcile_target = target_total_paise if len(unassigned_items) == 0 else None

    # 5. Final Amounts
    final_amounts_paise, discrepancy_paise, current_sum_paise = calculate_final_amounts(
        person_subtotals=person_subtotals_paise,
        tax_shares=tax_shares_paise,
        service_shares=service_shares_paise,
        discount_shares=discount_shares_paise,
        target_total_paise=reconcile_target,
    )

    final_amounts_rupees = {pid: to_rupees(amt) for pid, amt in final_amounts_paise.items()}
    grand_total_rupees = to_rupees(target_total_paise)
    is_valid, final_diff = validate_calculated_total(final_amounts_rupees, grand_total_rupees)


    # Build response models
    people_calculations: List[PersonCalculation] = []
    for p in people:
        pid = p.id
        tot_rupees = final_amounts_rupees[pid]
        pct = round((tot_rupees / grand_total_rupees) * 100, 2) if grand_total_rupees > 0 else 0.0

        calc = PersonCalculation(
            person_id=pid,
            name=p.name,
            color=p.color,
            items=person_shares[pid],
            items_subtotal=to_rupees(person_subtotals_paise[pid]),
            tax_share=to_rupees(tax_shares_paise.get(pid, 0)),
            service_charge_share=to_rupees(service_shares_paise.get(pid, 0)),
            discount_share=to_rupees(discount_shares_paise.get(pid, 0)),
            total_amount=tot_rupees,
            percentage_of_bill=pct,
        )
        people_calculations.append(calc)

    summary = CalculationSummary(
        currency=bill.currency or "INR",
        bill_subtotal=to_rupees(bill_subtotal_paise),
        assigned_subtotal=to_rupees(assigned_paise),
        unassigned_subtotal=to_rupees(unassigned_paise),
        total_tax=to_rupees(bill_tax_paise),
        total_service_charge=to_rupees(bill_service_paise),
        total_discount=to_rupees(bill_discount_paise),
        grand_total=grand_total_rupees,
        calculated_total_sum=round(sum(final_amounts_rupees.values()), 2),
        discrepancy=final_diff,
        unassigned_items=unassigned_items,
    )

    return CalculationResponse(
        people_calculations=people_calculations,
        summary=summary,
    )
