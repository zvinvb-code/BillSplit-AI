/**
 * @file Pure Financial Calculation Engine (Client-Side Mirror)
 *
 * Implements integer paise arithmetic (1 INR = 100 paise) to eliminate
 * floating-point rounding errors. Tax and service charge are strictly
 * distributed proportionally according to each participant's food consumption.
 */

export function toPaise(rupees) {
  if (rupees === null || rupees === undefined || isNaN(rupees)) return 0;
  return Math.round(Number(rupees) * 100);
}

export function toRupees(paise) {
  return Math.round(Number(paise)) / 100;
}

/**
 * STEP 1: Calculate each person's item subtotal in integer paise.
 * Divides shared items equally among assigned participants.
 * Supports quantity and unit price correctly.
 *
 * Example: Biryani (qty 2 @ 240 = 480). If assigned to Rahul + Me: Rahul = 240, Me = 240.
 */
export function calculatePersonSubtotals(billItems, people, assignments) {
  const peopleMap = new Map((people || []).map((p) => [p.id, p]));
  const personSubtotalsPaise = {};
  const personShares = {};
  people.forEach((p) => {
    personSubtotalsPaise[p.id] = 0;
    personShares[p.id] = [];
  });

  const unassignedItems = [];
  let assignedPaise = 0;
  let unassignedPaise = 0;

  (billItems || []).forEach((item) => {
    const itemTotalPaise = toPaise(item.total);
    const assignedIds = (assignments[item.id] || []).filter((id) => peopleMap.has(id));
    const numAssigned = assignedIds.length;

    if (numAssigned === 0) {
      unassignedItems.push(item.name);
      unassignedPaise += itemTotalPaise;
      return;
    }

    assignedPaise += itemTotalPaise;
    const fraction = 1 / numAssigned;
    const sharePaise = Math.round(itemTotalPaise / numAssigned);

    assignedIds.forEach((pid) => {
      personShares[pid].push({
        item_id: item.id,
        name: item.name,
        unit_price: item.unit_price,
        quantity: Math.round(item.quantity * fraction * 100) / 100,
        share_fraction: fraction,
        share_amount: toRupees(sharePaise),
      });
      personSubtotalsPaise[pid] += sharePaise;
    });
  });

  return {
    personSubtotalsPaise,
    personShares,
    unassignedItems,
    assignedPaise,
    unassignedPaise,
  };
}

/**
 * STEP 2 & 3: Distribute tax proportionally in integer paise according to consumption ratio.
 *
 * Rahul (500/1000 = 50%) -> 50% of GST
 * Ananya (300/1000 = 30%) -> 30% of GST
 * You (200/1000 = 20%) -> 20% of GST
 */
export function calculateTaxShares(personSubtotalsPaise, totalTaxRupees, totalConsumedPaise, method = 'proportional') {
  const totalTaxPaise = toPaise(totalTaxRupees);
  const pids = Object.keys(personSubtotalsPaise);
  if (totalTaxPaise <= 0 || pids.length === 0) {
    return Object.fromEntries(pids.map((id) => [id, 0]));
  }

  const taxSharesPaise = {};
  pids.forEach((pid) => {
    if (method === 'equal' || totalConsumedPaise <= 0) {
      taxSharesPaise[pid] = Math.round(totalTaxPaise / pids.length);
    } else {
      const ratio = personSubtotalsPaise[pid] / totalConsumedPaise;
      taxSharesPaise[pid] = Math.round(totalTaxPaise * ratio);
    }
  });

  return taxSharesPaise;
}

/**
 * STEP 4: Distribute service charge proportionally in integer paise.
 */
export function calculateServiceChargeShares(personSubtotalsPaise, totalServiceRupees, totalConsumedPaise, method = 'proportional') {
  const totalServicePaise = toPaise(totalServiceRupees);
  const pids = Object.keys(personSubtotalsPaise);
  if (totalServicePaise <= 0 || pids.length === 0) {
    return Object.fromEntries(pids.map((id) => [id, 0]));
  }

  const serviceSharesPaise = {};
  pids.forEach((pid) => {
    if (method === 'equal' || totalConsumedPaise <= 0) {
      serviceSharesPaise[pid] = Math.round(totalServicePaise / pids.length);
    } else {
      const ratio = personSubtotalsPaise[pid] / totalConsumedPaise;
      serviceSharesPaise[pid] = Math.round(totalServicePaise * ratio);
    }
  });

  return serviceSharesPaise;
}

/**
 * Distribute discount proportionally in integer paise.
 */
export function calculateDiscountShares(personSubtotalsPaise, totalDiscountRupees, totalConsumedPaise, method = 'proportional') {
  const totalDiscountPaise = toPaise(totalDiscountRupees);
  const pids = Object.keys(personSubtotalsPaise);
  if (totalDiscountPaise <= 0 || pids.length === 0) {
    return Object.fromEntries(pids.map((id) => [id, 0]));
  }

  const discountSharesPaise = {};
  pids.forEach((pid) => {
    if (method === 'equal' || totalConsumedPaise <= 0) {
      discountSharesPaise[pid] = Math.round(totalDiscountPaise / pids.length);
    } else {
      const ratio = personSubtotalsPaise[pid] / totalConsumedPaise;
      discountSharesPaise[pid] = Math.round(totalDiscountPaise * ratio);
    }
  });

  return discountSharesPaise;
}

/**
 * STEP 5: Final amount per person in integer paise:
 * person_subtotal + proportional_tax + proportional_service - proportional_discount
 *
 * REMAINDER RECONCILIATION POLICY:
 * Due to integer division of cents/paise, sum(final_amounts) may occasionally differ
 * from target_total by 1–2 paise. Standard accounting convention allocates this
 * 1–2 paise remainder to the participant with the largest subtotal (who ordered the most).
 */
export function calculateFinalAmounts(
  personSubtotalsPaise,
  taxSharesPaise,
  serviceSharesPaise,
  discountSharesPaise,
  targetTotalPaise = null
) {
  const pids = Object.keys(personSubtotalsPaise);
  const finalAmountsPaise = {};

  pids.forEach((pid) => {
    const sub = personSubtotalsPaise[pid] || 0;
    const t = taxSharesPaise[pid] || 0;
    const s = serviceSharesPaise[pid] || 0;
    const d = discountSharesPaise[pid] || 0;
    finalAmountsPaise[pid] = Math.max(0, sub + t + s - d);
  });

  let currentSumPaise = Object.values(finalAmountsPaise).reduce((a, b) => a + b, 0);
  let discrepancyPaise = 0;

  if (targetTotalPaise !== null && pids.length > 0) {
    discrepancyPaise = targetTotalPaise - currentSumPaise;
    if (Math.abs(discrepancyPaise) === 1 || Math.abs(discrepancyPaise) === 2) {
      // Allocate 1-2 paise remainder to participant with largest subtotal
      const largestPid = pids.reduce((maxId, id) =>
        personSubtotalsPaise[id] > (personSubtotalsPaise[maxId] || 0) ? id : maxId
      , pids[0]);

      finalAmountsPaise[largestPid] += discrepancyPaise;
      currentSumPaise = Object.values(finalAmountsPaise).reduce((a, b) => a + b, 0);
      discrepancyPaise = targetTotalPaise - currentSumPaise;
    }
  }

  return {
    finalAmountsPaise,
    discrepancyPaise,
    currentSumPaise,
  };
}

/**
 * Validates whether sum(final_amounts) strictly matches the bill target total.
 */
export function validateCalculatedTotal(finalAmountsRupees, targetTotalRupees) {
  const calculatedSum = Math.round(Object.values(finalAmountsRupees).reduce((a, b) => a + b, 0) * 100) / 100;
  const diff = Math.round((targetTotalRupees - calculatedSum) * 100) / 100;
  return {
    isValid: Math.abs(diff) < 0.01,
    difference: diff,
    calculatedSum,
  };
}
