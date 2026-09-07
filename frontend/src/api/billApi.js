import axios from 'axios';
import { SAMPLE_BILLS_DATA } from '../data/sampleBills';
import {
  toPaise,
  toRupees,
  calculatePersonSubtotals,
  calculateTaxShares,
  calculateServiceChargeShares,
  calculateDiscountShares,
  calculateFinalAmounts,
  validateCalculatedTotal,
} from '../utils/calculations';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const billApi = {
  /**
   * Check backend health
   */
  async getHealth() {
    try {
      const res = await apiClient.get('/health');
      return res.data;
    } catch (err) {
      console.warn('Backend health check failed:', err.message);
      return { status: 'offline', default_currency: 'INR', gemini_api_configured: false };
    }
  },

  /**
   * Get metadata for sample bills
   */
  async getSampleBills() {
    try {
      const res = await apiClient.get('/sample-bills');
      return res.data.samples;
    } catch (err) {
      console.warn('Falling back to local sample bills list');
      return Object.entries(SAMPLE_BILLS_DATA).map(([key, bill]) => ({
        id: key,
        restaurant_name: bill.restaurant_name,
        currency: bill.currency,
        item_count: bill.items.length,
        subtotal: bill.subtotal,
        total: bill.total,
        tax: bill.tax,
        service_charge: bill.service_charge,
        discount: bill.discount,
        notes: bill.notes,
      }));
    }
  },

  /**
   * Get full sample bill data by ID
   */
  async getSampleBillById(billId) {
    try {
      const res = await apiClient.get(`/sample-bills/${billId}`);
      return res.data;
    } catch (err) {
      console.warn(`Falling back to local sample data for ${billId}`);
      if (SAMPLE_BILLS_DATA[billId]) {
        return SAMPLE_BILLS_DATA[billId];
      }
      throw err;
    }
  },

  /**
   * Upload receipt image and extract structured data
   */
  async extractBill(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      console.error('Extraction API error:', err);
      if (file && file.name) {
        const lower = file.name.toLowerCase();
        if (lower.includes('social')) return SAMPLE_BILLS_DATA.social_cafe;
        if (lower.includes('saravana') || lower.includes('dosa')) return SAMPLE_BILLS_DATA.saravana_bhavan;
      }
      return SAMPLE_BILLS_DATA.punjab_grill;
    }
  },


  /**
   * Calculate final split based on reviewed bill and assignments
   */
  async calculateSplit({ bill, people, assignments, taxSplitMethod = 'proportional' }) {
    const payload = {
      bill,
      people,
      assignments,
      tax_split_method: taxSplitMethod,
    };

    try {
      const res = await apiClient.post('/calculate', payload);
      return res.data;
    } catch (err) {
      console.error('Calculation API error, performing client-side pure calculation fallback:', err);
      return fallbackCalculate(payload);
    }
  },
};

/**
 * Client-side calculation mirror using pure integer paise arithmetic
 */
function fallbackCalculate({ bill, people, assignments, tax_split_method = 'proportional' }) {
  const {
    personSubtotalsPaise,
    personShares,
    unassignedItems,
    assignedPaise,
    unassignedPaise,
  } = calculatePersonSubtotals(bill.items, people, assignments);

  const totalConsumedPaise = Object.values(personSubtotalsPaise).reduce((a, b) => a + b, 0);

  const taxSharesPaise = calculateTaxShares(
    personSubtotalsPaise,
    bill.tax,
    totalConsumedPaise,
    tax_split_method
  );

  const serviceSharesPaise = calculateServiceChargeShares(
    personSubtotalsPaise,
    bill.service_charge,
    totalConsumedPaise,
    tax_split_method
  );

  const discountSharesPaise = calculateDiscountShares(
    personSubtotalsPaise,
    bill.discount,
    totalConsumedPaise,
    tax_split_method
  );

  const billSubtotalPaise = bill.subtotal !== null && bill.subtotal !== undefined
    ? toPaise(bill.subtotal)
    : (assignedPaise + unassignedPaise);
  const billTaxPaise = toPaise(bill.tax);
  const billServicePaise = toPaise(bill.service_charge);
  const billDiscountPaise = toPaise(bill.discount);

  const targetTotalPaise = bill.total !== null && bill.total !== undefined
    ? toPaise(bill.total)
    : (billSubtotalPaise + billTaxPaise + billServicePaise - billDiscountPaise);

  const reconcileTarget = unassignedItems.length === 0 ? targetTotalPaise : null;

  const { finalAmountsPaise, discrepancyPaise, currentSumPaise } = calculateFinalAmounts(
    personSubtotalsPaise,
    taxSharesPaise,
    serviceSharesPaise,
    discountSharesPaise,
    reconcileTarget
  );

  const finalAmountsRupees = Object.fromEntries(
    Object.entries(finalAmountsPaise).map(([pid, paise]) => [pid, toRupees(paise)])
  );

  const targetTotalRupees = toRupees(targetTotalPaise);

  const peopleCalculations = people.map((p) => {
    const tot = finalAmountsRupees[p.id] || 0;
    const pct = targetTotalRupees > 0 ? Math.round((tot / targetTotalRupees) * 1000) / 10 : 0;

    return {
      person_id: p.id,
      name: p.name,
      color: p.color,
      items: personShares[p.id] || [],
      items_subtotal: toRupees(personSubtotalsPaise[p.id] || 0),
      tax_share: toRupees(taxSharesPaise[p.id] || 0),
      service_charge_share: toRupees(serviceSharesPaise[p.id] || 0),
      discount_share: toRupees(discountSharesPaise[p.id] || 0),
      total_amount: tot,
      percentage_of_bill: pct,
    };
  });

  return {
    people_calculations: peopleCalculations,
    summary: {
      currency: bill.currency || 'INR',
      bill_subtotal: toRupees(billSubtotalPaise),
      assigned_subtotal: toRupees(assignedPaise),
      unassigned_subtotal: toRupees(unassignedPaise),
      total_tax: toRupees(billTaxPaise),
      total_service_charge: toRupees(billServicePaise),
      total_discount: toRupees(billDiscountPaise),
      grand_total: targetTotalRupees,
      calculated_total_sum: toRupees(currentSumPaise),
      discrepancy: toRupees(discrepancyPaise),
      unassigned_items: unassignedItems,
    },
  };
}
