import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Info,
  Key,
  ShieldAlert,
  Check,
} from 'lucide-react';
import ReceiptVisualizer from './ReceiptVisualizer';
import { formatCurrency, getConfidenceBadge } from '../utils/formatters';

export default function Step3Review({
  initialBill,
  previewImage,
  onConfirmReviewedBill,
  onOpenApiKeyModal,
}) {
  const [bill, setBill] = useState(initialBill);
  const [manuallyVerified, setManuallyVerified] = useState({});

  useEffect(() => {
    if (initialBill) {
      setBill(initialBill);
      setManuallyVerified({});
    }
  }, [initialBill]);

  const currency = bill.currency || '₹';

  const markVerified = (key) => {
    setManuallyVerified((prev) => ({ ...prev, [key]: true }));
  };

  const handleHeaderChange = (field, val) => {
    setBill((prev) => ({ ...prev, [field]: val }));
    markVerified(field);
  };

  const handleItemChange = (index, field, value) => {
    const item = bill.items[index];
    const itemKey = `item_${item.id || index}_${field}`;
    markVerified(itemKey);
    markVerified(`item_${item.id || index}_overall`);

    setBill((prev) => {
      const newItems = [...prev.items];
      const updatedItem = { ...newItems[index] };

      if (field === 'quantity') {
        const q = parseFloat(value);
        updatedItem.quantity = isNaN(q) ? value : q;
        if (!isNaN(q) && q > 0 && typeof updatedItem.unit_price === 'number') {
          updatedItem.total = Math.round(q * updatedItem.unit_price * 100) / 100;
        }
      } else if (field === 'unit_price') {
        const up = parseFloat(value);
        updatedItem.unit_price = isNaN(up) ? value : up;
        if (!isNaN(up) && up >= 0 && typeof updatedItem.quantity === 'number') {
          updatedItem.total = Math.round(updatedItem.quantity * up * 100) / 100;
        }
      } else if (field === 'total') {
        const tot = parseFloat(value);
        updatedItem.total = isNaN(tot) ? value : tot;
      } else {
        updatedItem[field] = value;
      }

      newItems[index] = updatedItem;

      const allValidTotals = newItems.every((it) => typeof it.total === 'number' && !isNaN(it.total));
      let newSubtotal = prev.subtotal;
      let newTotal = prev.total;

      if (allValidTotals) {
        newSubtotal = Math.round(newItems.reduce((sum, it) => sum + (it.total || 0), 0) * 100) / 100;
        const taxVal = typeof prev.tax === 'number' ? prev.tax : 0;
        const scVal = typeof prev.service_charge === 'number' ? prev.service_charge : 0;
        const discVal = typeof prev.discount === 'number' ? prev.discount : 0;
        newTotal = Math.round((newSubtotal + taxVal + scVal - discVal) * 100) / 100;
      }

      return {
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        total: newTotal,
      };
    });
  };

  const handleAddItem = () => {
    setBill((prev) => {
      const newItemId = `item_${prev.items.length + 1}`;
      const newItems = [
        ...prev.items,
        {
          id: newItemId,
          name: 'New Line Item',
          quantity: 1,
          unit_price: 100,
          total: 100,
          confidence: 1.0,
        },
      ];
      const newSubtotal = Math.round(newItems.reduce((sum, it) => sum + (it.total || 0), 0) * 100) / 100;
      const taxVal = typeof prev.tax === 'number' ? prev.tax : 0;
      const scVal = typeof prev.service_charge === 'number' ? prev.service_charge : 0;
      const discVal = typeof prev.discount === 'number' ? prev.discount : 0;
      const newTotal = Math.round((newSubtotal + taxVal + scVal - discVal) * 100) / 100;

      return {
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        total: newTotal,
      };
    });
  };

  const handleDeleteItem = (index) => {
    if (bill.items.length <= 1) {
      alert('A bill must contain at least one line item.');
      return;
    }
    setBill((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const newSubtotal = Math.round(newItems.reduce((sum, it) => sum + (it.total || 0), 0) * 100) / 100;
      const taxVal = typeof prev.tax === 'number' ? prev.tax : 0;
      const scVal = typeof prev.service_charge === 'number' ? prev.service_charge : 0;
      const discVal = typeof prev.discount === 'number' ? prev.discount : 0;
      const newTotal = Math.round((newSubtotal + taxVal + scVal - discVal) * 100) / 100;

      return {
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        total: newTotal,
      };
    });
  };

  const handleFinancialFieldChange = (field, val) => {
    markVerified(field);
    const parsed = parseFloat(val);
    const numVal = isNaN(parsed) ? 0 : parsed;

    setBill((prev) => {
      const updated = { ...prev, [field]: isNaN(parsed) ? val : numVal };
      const sub = typeof updated.subtotal === 'number' ? updated.subtotal : 0;
      const tax = typeof updated.tax === 'number' ? updated.tax : 0;
      const sc = typeof updated.service_charge === 'number' ? updated.service_charge : 0;
      const disc = typeof updated.discount === 'number' ? updated.discount : 0;

      if (field !== 'total') {
        updated.total = Math.round((sub + tax + sc - disc) * 100) / 100;
      }
      return updated;
    });
  };

  const fieldConfidence = useMemo(() => {
    return bill.confidence || bill.field_confidence || {};
  }, [bill]);

  const itemsSum = useMemo(() => {
    return Math.round((bill.items || []).reduce((acc, item) => acc + (Number(item.total) || 0), 0) * 100) / 100;
  }, [bill.items]);

  const calculatedGrandTotal = useMemo(() => {
    const taxVal = Number(bill.tax) || 0;
    const scVal = Number(bill.service_charge) || 0;
    const discVal = Number(bill.discount) || 0;
    return Math.round((itemsSum + taxVal + scVal - discVal) * 100) / 100;
  }, [itemsSum, bill.tax, bill.service_charge, bill.discount]);

  const totalDiscrepancy = useMemo(() => {
    const printedTotal = Number(bill.total) || 0;
    return Math.round((calculatedGrandTotal - printedTotal) * 100) / 100;
  }, [calculatedGrandTotal, bill.total]);

  const hasDiscrepancy = Math.abs(totalDiscrepancy) > 0.01;

  const isValid = useMemo(() => {
    if (!bill.restaurant_name || !bill.restaurant_name.trim()) return false;
    if (!bill.items || bill.items.length === 0) return false;
    return bill.items.every(
      (it) =>
        it.name &&
        it.name.trim() !== '' &&
        typeof it.quantity === 'number' &&
        it.quantity > 0 &&
        typeof it.unit_price === 'number' &&
        it.unit_price >= 0 &&
        typeof it.total === 'number' &&
        it.total >= 0
    );
  }, [bill]);

  const renderStatusBadge = (fieldKey, rawScore) => {
    if (manuallyVerified[fieldKey]) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>Edited</span>
        </span>
      );
    }

    const badge = getConfidenceBadge(rawScore ?? 0.95);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
        <span>{badge.label} {badge.percentage}</span>
      </span>
    );
  };

  const handleConfirm = () => {
    if (!isValid) {
      alert('Please correct any invalid or missing item fields before continuing.');
      return;
    }
    onConfirmReviewedBill(bill);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Review Extracted Details
            </h1>
            {bill.is_fallback && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Demo Sample Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600">
            Verify AI-extracted line items, quantities, prices, and tax breakdown before proceeding.
          </p>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-xs ${
            isValid
              ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          <span>Confirm & Proceed to Assign</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Discrepancy Alert Banner */}
      {hasDiscrepancy && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-900">
              Printed Total Mismatch Detected
            </p>
            <p className="text-amber-800 leading-relaxed">
              Calculated sum ({formatCurrency(calculatedGrandTotal, currency)}) differs from printed total ({formatCurrency(bill.total, currency)}) by{' '}
              <span className="font-bold">{formatCurrency(Math.abs(totalDiscrepancy), currency)}</span>.
              The financial engine will automatically reconcile penny discrepancies during the final split.
            </p>
          </div>
        </div>
      )}

      {/* Split Layout: Bill Preview | Extracted Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Bill Receipt Visualizer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Original Bill Preview
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {bill.items?.length || 0} line items
              </span>
            </div>
            <ReceiptVisualizer bill={bill} customImageSrc={previewImage} />
          </div>
        </div>

        {/* Right Column: Editable Items Grid */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
            {/* Restaurant Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">
                    Restaurant Name
                  </label>
                  {renderStatusBadge('restaurant_name', fieldConfidence['restaurant_name'])}
                </div>
                <input
                  type="text"
                  value={bill.restaurant_name || ''}
                  onChange={(e) => handleHeaderChange('restaurant_name', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="e.g. Punjab Grill"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">
                    Currency Symbol
                  </label>
                  {renderStatusBadge('currency', 1.0)}
                </div>
                <input
                  type="text"
                  value={bill.currency || '₹'}
                  onChange={(e) => handleHeaderChange('currency', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="₹"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Line Items ({bill.items.length})
                </h3>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {bill.items.map((item, index) => {
                  const itemKey = `item_${item.id || index}_overall`;
                  const score = item.confidence ?? 0.95;

                  return (
                    <div
                      key={item.id || index}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-400 font-mono">
                          #{index + 1}
                        </span>
                        {renderStatusBadge(itemKey, score)}
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Item Name */}
                        <div className="col-span-5 sm:col-span-5">
                          <input
                            type="text"
                            value={item.name || ''}
                            placeholder="Item Name"
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2 sm:col-span-2">
                          <input
                            type="number"
                            step="1"
                            min="0.1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-center text-slate-900 focus:outline-none focus:border-emerald-500 font-mono-nums"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-2 sm:col-span-2">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-right text-slate-900 focus:outline-none focus:border-emerald-500 font-mono-nums"
                          />
                        </div>

                        {/* Total */}
                        <div className="col-span-2 sm:col-span-2">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={item.total}
                            onChange={(e) => handleItemChange(index, 'total', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-right text-emerald-800 focus:outline-none focus:border-emerald-600 font-mono-nums"
                          />
                        </div>

                        {/* Delete button */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overheads Section (Subtotal, Tax, Service Charge, Discount) */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Subtotal */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Subtotal
                  </label>
                  {renderStatusBadge('subtotal', fieldConfidence['subtotal'])}
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={bill.subtotal ?? ''}
                  onChange={(e) => handleFinancialFieldChange('subtotal', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono-nums text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tax */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-600">
                    GST Tax
                  </label>
                  {renderStatusBadge('tax', fieldConfidence['tax'])}
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={bill.tax ?? ''}
                  onChange={(e) => handleFinancialFieldChange('tax', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono-nums text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Service Charge */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Service Charge
                  </label>
                  {renderStatusBadge('service_charge', fieldConfidence['service_charge'])}
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={bill.service_charge ?? ''}
                  onChange={(e) => handleFinancialFieldChange('service_charge', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono-nums text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Discount */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Discount
                  </label>
                  {renderStatusBadge('discount', 1.0)}
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={bill.discount ?? ''}
                  onChange={(e) => handleFinancialFieldChange('discount', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono-nums text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Printed Grand Total Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                    Printed Grand Total ({currency})
                  </span>
                  {renderStatusBadge('total', fieldConfidence['total'])}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={bill.total ?? ''}
                    onChange={(e) => handleFinancialFieldChange('total', e.target.value)}
                    className="w-44 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-lg font-black font-mono-nums text-emerald-700 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    Sum: {formatCurrency(calculatedGrandTotal, currency)}
                  </span>
                </div>
              </div>

              {/* Confirm CTA */}
              <button
                onClick={handleConfirm}
                disabled={!isValid}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xs ${
                  isValid
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <span>Confirm & Proceed to Assign</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
