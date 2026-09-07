/**
 * @file Data structures and calculation helpers for People and Item Assignments
 * Stored separately from the immutable bill data.
 */

/**
 * @typedef {Object} Person
 * @property {string} id - Unique identifier for the person (e.g. 'p_1')
 * @property {string} name - Display name of the person (e.g. 'Rahul', 'Ananya', 'Me')
 * @property {string} [color] - Hex color code for UI representation
 */

/**
 * Map of bill item ID to an array of person IDs assigned to that item.
 * @typedef {Object.<string, string[]>} ItemAssignments
 * Example:
 * {
 *   "item_1": ["p_1", "p_2"],  // Biryani split between Rahul and Me
 *   "item_2": ["p_3"],         // Coke for Ananya
 *   "item_3": ["p_1", "p_2", "p_3"] // Paneer Tikka for Everyone
 * }
 */

/**
 * Validates whether the people list is within the allowed 1-10 range.
 * @param {Person[]} people
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePeopleCount(people) {
  if (!people || people.length === 0) {
    return { valid: false, error: "Please add at least 1 person." };
  }
  if (people.length > 10) {
    return { valid: false, error: "Maximum 10 people allowed per split." };
  }
  return { valid: true };
}

/**
 * Returns an array of item names that have not been assigned to any person.
 * @param {Array<{ id: string, name: string }>} billItems
 * @param {ItemAssignments} assignments
 * @param {Person[]} people
 * @returns {Array<{ id: string, name: string }>}
 */
export function getUnassignedBillItems(billItems, assignments, people) {
  const peopleIds = new Set((people || []).map((p) => p.id));
  return (billItems || []).filter((item) => {
    const assignedIds = assignments[item.id] || [];
    const validAssigned = assignedIds.filter((id) => peopleIds.has(id));
    return validAssigned.length === 0;
  });
}

/**
 * Computes raw food item totals for each person.
 * Strictly calculates item shares only (no tax or service charges applied at this stage).
 *
 * Example:
 * Biryani: quantity = 2, unit_price = 240, total = 480
 * Assigned to Rahul + Me: Rahul = 240, Me = 240
 *
 * @param {Array<{ id: string, name: string, quantity: number, unit_price: number, total: number }>} billItems
 * @param {Person[]} people
 * @param {ItemAssignments} assignments
 * @returns {{ personSubtotals: Object.<string, number>, totalAssignedAmount: number }}
 */
export function computeRawItemShares(billItems, people, assignments) {
  const peopleMap = new Map((people || []).map((p) => [p.id, p]));
  const personSubtotals = {};
  people.forEach((p) => {
    personSubtotals[p.id] = 0;
  });

  let totalAssignedAmount = 0;

  (billItems || []).forEach((item) => {
    const assignedIds = (assignments[item.id] || []).filter((id) => peopleMap.has(id));
    if (assignedIds.length > 0) {
      const numPeople = assignedIds.length;
      const shareAmount = Math.round((item.total / numPeople) * 100) / 100;
      totalAssignedAmount += item.total;

      assignedIds.forEach((pid) => {
        personSubtotals[pid] = (personSubtotals[pid] || 0) + shareAmount;
      });
    }
  });

  // Round each person's subtotal to 2 decimals
  Object.keys(personSubtotals).forEach((pid) => {
    personSubtotals[pid] = Math.round(personSubtotals[pid] * 100) / 100;
  });

  return {
    personSubtotals,
    totalAssignedAmount: Math.round(totalAssignedAmount * 100) / 100,
  };
}
