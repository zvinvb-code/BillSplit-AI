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
  Edit3,
  HelpCircle,
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
  // Track manually verified fields: fieldKey -> boolean
  const [manuallyVerified, setManuallyVerified] = useState({});

  // Sync state if initialBill updates
  useEffect(() => {
    if (initialBill) {
      setBill(initialBill);
      setManuallyVerified({});
    }
  }, [initialBill]);

  const currency = bill.currency || '₹';

  // Mark a specific field as manually verified
  const markVerified = (key) => {
    setManuallyVerified((prev) => ({ ...prev, [key]: true }));
  };

  // Handle header changes
  const handleHeaderChange = (field, val) => {
    setBill((prev) => ({ ...prev, [field]: val }));
    markVerified(field);
  };

  // Handle item change
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

      // Automatically sync subtotal if all items have numeric totals
      const allValidTotals = newItems.every((it) => typeof it.total === 'number' && !isNaN(it.total));
      let newSubtotal = prev.subtotal;
      let newTotal = prev.total;

      if (allValidTotals) {
        newSubtotal = Math.round(newItems.reduce((sum, it) => sum + it.total, 0) * 100) / 100;
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

  // Add new item
  const handleAddItem = () => {
    const newId = `item_manual_${Date.now()}`;
    const newItem = {
      id: newId,
      name: 'New Item',
      quantity: 1.0,
      unit_price: 100.0,
      total: 100.0,
      confidence: 1.0,
    };
    markVerified(`item_${newId}_overall`);

    setBill((prev) => {
      const newItems = [...prev.items, newItem];
      const newSubtotal = Math.round(newItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0) * 100) / 100;
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

  // Delete item
  const handleDeleteItem = (index) => {
    if (bill.items.length <= 1) {
      alert('The bill must contain at least one line item.');
      return;
    }
    setBill((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const newSubtotal = Math.round(newItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0) * 100) / 100;
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

  // Handle tax/discount/service charge/subtotal/total manual changes
  const handleFinancialFieldChange = (field, val) => {
    markVerified(field);
    const parsed = val === '' ? null : parseFloat(val);

    setBill((prev) => {
      const updated = { ...prev, [field]: isNaN(parsed) ? val : parsed };
      // If user is editing subtotal, tax, sc, or discount, recalculate total if total hasn't been manually overridden
      if (field !== 'total') {
        const sub = typeof updated.subtotal === 'number' ? updated.subtotal : 0;
        const t = typeof updated.tax === 'number' ? updated.tax : 0;
        const s = typeof updated.service_charge === 'number' ? updated.service_charge : 0;
        const d = typeof updated.discount === 'number' ? updated.discount : 0;
        updated.total = Math.round((sub + t + s - d) * 100) / 100;
      }
      return updated;
    });
  };

  // --- Form Validation (Negative prices, invalid quantities, required fields) ---
  const validationErrors = useMemo(() => {
    const errors = [];

    if (!bill.items || bill.items.length === 0) {
      errors.push('At least one line item is required.');
    }

    bill.items.forEach((item, idx) => {
      const rowNum = idx + 1;
      if (!item.name || !item.name.trim()) {
        errors.push(`Item #${rowNum} has an empty name.`);
      }
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
        errors.push(`Item #${rowNum} ("${item.name || 'Unnamed'}") quantity must be greater than 0.`);
      }
      if (typeof item.unit_price !== 'number' || isNaN(item.unit_price) || item.unit_price < 0) {
        errors.push(`Item #${rowNum} ("${item.name || 'Unnamed'}") unit price cannot be negative.`);
      }
      if (typeof item.total !== 'number' || isNaN(item.total) || item.total < 0) {
        errors.push(`Item #${rowNum} ("${item.name || 'Unnamed'}") total cannot be negative.`);
      }
    });

    if (bill.subtotal !== null && (typeof bill.subtotal !== 'number' || isNaN(bill.subtotal) || bill.subtotal < 0)) {
      errors.push('Subtotal cannot be negative.');
    }
    if (bill.tax !== null && (typeof bill.tax !== 'number' || isNaN(bill.tax) || bill.tax < 0)) {
      errors.push('Tax cannot be negative.');
    }
    if (bill.service_charge !== null && (typeof bill.service_charge !== 'number' || isNaN(bill.service_charge) || bill.service_charge < 0)) {
      errors.push('Service charge cannot be negative.');
    }
    if (bill.discount !== null && (typeof bill.discount !== 'number' || isNaN(bill.discount) || bill.discount < 0)) {
      errors.push('Discount cannot be negative.');
    }
    if (bill.total !== null && (typeof bill.total !== 'number' || isNaN(bill.total) || bill.total < 0)) {
      errors.push('Grand total cannot be negative.');
    }

    return errors;
  }, [bill]);

  const isValid = validationErrors.length === 0;

  // Sanity check: sum of items vs subtotal
  const calculatedItemsSum = Math.round(
    bill.items.reduce((sum, it) => sum + (typeof it.total === 'number' && !isNaN(it.total) ? it.total : 0), 0) * 100
  ) / 100;
  const isSubtotalMatched = bill.subtotal !== null && Math.abs(calculatedItemsSum - (bill.subtotal || 0)) < 0.05;

  const handleConfirm = () => {
    if (!isValid) {
      alert(`Please fix validation errors:\n• ${validationErrors.join('\n• ')}`);
      return;
    }
    onConfirmReviewedBill(bill);
  };

  // Status Badge Renderer: either "Manually verified" or AI Confidence Badge
  const renderStatusBadge = (fieldKey, aiConfidenceScore) => {
    const isVerified = manuallyVerified[fieldKey];

    if (isVerified) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 transition-all animate-in fade-in"
          title="Manually verified by user"
        >
          <Check className="w-3 h-3 text-sky-400 stroke-[2.5]" />
          <span>Manually verified</span>
        </span>
      );
    }

    const badge = getConfidenceBadge(aiConfidenceScore ?? 0.95);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.bg}`}
        title={`AI extracted with ${badge.label} (${badge.percentage})`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
        <span>{badge.label}</span>
      </span>
    );
  };

  const fieldConfidence = bill.field_confidence || {};
  const isFallback = Boolean(bill.is_fallback);
  const fallbackReason = bill.fallback_reason || '';
  const isProviderFailure =
    fallbackReason.toLowerCase().includes('vision') ||
    fallbackReason.toLowerCase().includes('failed') ||
    fallbackReason.toLowerCase().includes('error');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Fallback Notice Banner if AI provider failed or is offline */}
      {isFallback ? (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isProviderFailure
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {isProviderFailure ? (
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    {isProviderFailure
                      ? 'Vision Provider Notice: Fallback Data Active'
                      : 'Demo Mode: Fallback Data Active'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isProviderFailure
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    Mock Extractor
                  </span>
                </div>
                <p className="text-xs opacity-90">{fallbackReason}</p>
                <p className="text-[11px] text-slate-400">
                  Every field below is fully editable. Edited values are automatically marked as &quot;Manually verified&quot;.
                </p>
              </div>
            </div>

            {onOpenApiKeyModal && (
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-all shrink-0 self-start sm:self-center"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure Gemini Key</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">
              Extracted live via Google Gemini 2.5 Flash Vision Model
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
            Vision Provider Active
          </span>
        </div>
      )}

      {/* Top Workflow Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Review & Verify Bill Data</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Step 3 of 6
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Review AI extractions before any splitting calculation occurs. Edit values or mark as verified.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 border-r border-slate-800 pr-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> &ge;90% High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> 75-89% Med
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> &lt;75% Low
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <Check className="w-3 h-3" /> Verified
            </span>
          </div>

          {/* Confirm CTA */}
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg ${
              isValid
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
            }`}
            title={isValid ? 'Confirm reviewed bill' : 'Fix validation errors to continue'}
          >
            <span>Confirm Bill →</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Alert Banner if invalid */}
      {!isValid && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Please fix the following issues before confirming:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 text-rose-200/90">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main SaaS Workstation: LEFT Preview, RIGHT Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Bill Image Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Bill Image Preview
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {previewImage ? 'Uploaded Photograph' : 'Physical Receipt Mockup'}
            </span>
          </div>

          <div className="sticky top-20 space-y-4">
            <ReceiptVisualizer bill={bill} customImageSrc={previewImage} />

            {/* Field Confidence Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  AI Confidence Dashboard
                </span>
                <span className="text-[10px] text-slate-500">Summary Fields</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['subtotal', 'tax', 'service_charge', 'total'].map((fKey) => {
                  const confVal = fieldConfidence[fKey];
                  return (
                    <div
                      key={fKey}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between gap-1"
                    >
                      <span className="capitalize text-slate-400 text-[11px] font-medium">
                        {fKey.replace('_', ' ')}
                      </span>
                      <div>{renderStatusBadge(fKey, confVal)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extraction Notes */}
            {bill.notes && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>{bill.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Extracted Bill Information Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* Restaurant & Currency Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Establishment Details
              </h3>
              <div>{renderStatusBadge('restaurant_name', 0.95)}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Restaurant / Cafe Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bill.restaurant_name || ''}
                    placeholder="e.g. Punjab Grill & Bar"
                    onChange={(e) => handleHeaderChange('restaurant_name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  {manuallyVerified['restaurant_name'] && (
                    <span className="absolute right-3 top-2.5 text-sky-400" title="Manually edited">
                      <Edit3 className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Currency Symbol / Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => handleHeaderChange('currency', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 text-center uppercase"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-semibold">
                    INR / ₹
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Menu Items ({bill.items.length})
                </h3>
                {isSubtotalMatched ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Sum matches subtotal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-medium">
                    <AlertCircle className="w-3 h-3" /> Items sum: {formatCurrency(calculatedItemsSum, currency)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-1">Dish / Item Name</th>
                    <th className="pb-3 text-center w-20">Quantity</th>
                    <th className="pb-3 text-right w-24">Unit Price</th>
                    <th className="pb-3 text-right w-24">Line Total</th>
                    <th className="pb-3 text-center w-36">Status</th>
                    <th className="pb-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bill.items.map((item, idx) => {
                    const rowKey = `item_${item.id || idx}_overall`;
                    const isRowVerified = manuallyVerified[rowKey];

                    // Input errors
                    const isNameEmpty = !item.name || !item.name.trim();
                    const isQtyInvalid =
                      typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0;
                    const isPriceInvalid =
                      typeof item.unit_price !== 'number' || isNaN(item.unit_price) || item.unit_price < 0;

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-950/40 transition-colors group">
                        {/* Name */}
                        <td className="py-2.5 pl-1 pr-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border text-white focus:outline-none transition-colors ${
                              isNameEmpty ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-emerald-500'
                            }`}
                            placeholder="Item name"
                          />
                          {isNameEmpty && (
                            <span className="text-[10px] text-rose-400 block mt-0.5">Required</span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0.1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg bg-slate-950 border text-center font-mono-nums text-white focus:outline-none transition-colors ${
                              isQtyInvalid ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-emerald-500'
                            }`}
                          />
                          {isQtyInvalid && (
                            <span className="text-[10px] text-rose-400 block mt-0.5">&gt; 0</span>
                          )}
                        </td>

                        {/* Unit Price */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg bg-slate-950 border text-right font-mono-nums text-white focus:outline-none transition-colors ${
                              isPriceInvalid ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-emerald-500'
                            }`}
                          />
                          {isPriceInvalid && (
                            <span className="text-[10px] text-rose-400 block mt-0.5">&ge; 0</span>
                          )}
                        </td>

                        {/* Line Total */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={item.total}
                            onChange={(e) => handleItemChange(idx, 'total', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-right font-mono-nums font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500"
                          />
                        </td>

                        {/* Confidence / Manually Verified Badge */}
                        <td className="py-2.5 px-2 text-center">
                          {renderStatusBadge(rowKey, item.confidence)}
                        </td>

                        {/* Delete Row */}
                        <td className="py-2.5 pl-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotal, Taxes, Service Charge, Discount, and Total Section */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Summary & Overheads ({currency})
              </h3>
              <span className="text-[11px] text-slate-500">Editable taxes and discounts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Subtotal */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-400">
                    Subtotal
                  </label>
                  {renderStatusBadge('subtotal', fieldConfidence['subtotal'])}
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={bill.subtotal ?? ''}
                  placeholder="0.00"
                  onChange={(e) => handleFinancialFieldChange('subtotal', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold font-mono-nums text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block">Food & drinks pre-tax</span>
              </div>

              {/* Tax (GST) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-400">
                    Tax / GST
                  </label>
                  {renderStatusBadge('tax', fieldConfidence['tax'])}
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={bill.tax ?? ''}
                  placeholder="0.00"
                  onChange={(e) => handleFinancialFieldChange('tax', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold font-mono-nums text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block">CGST + SGST (e.g. 5%)</span>
              </div>

              {/* Service Charge */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-400">
                    Service Charge
                  </label>
                  {renderStatusBadge('service_charge', fieldConfidence['service_charge'])}
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={bill.service_charge ?? ''}
                  placeholder="0.00"
                  onChange={(e) => handleFinancialFieldChange('service_charge', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold font-mono-nums text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block">Tip / Gratuity</span>
              </div>

              {/* Discount */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-400">
                    Discount
                  </label>
                  {renderStatusBadge('discount', 1.0)}
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={bill.discount ?? ''}
                  placeholder="0.00"
                  onChange={(e) => handleFinancialFieldChange('discount', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold font-mono-nums text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 block">Voucher / Gold discount</span>
              </div>
            </div>

            {/* Printed Grand Total Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
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
                    placeholder="0.00"
                    onChange={(e) => handleFinancialFieldChange('total', e.target.value)}
                    className="w-48 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xl font-black font-mono-nums text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-500">
                    Expected: {formatCurrency(bill.total, currency)}
                  </span>
                </div>
              </div>

              {/* Confirm Bill CTA */}
              <button
                onClick={handleConfirm}
                disabled={!isValid}
                className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg ${
                  isValid
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                }`}
              >
                <span>Confirm Bill →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
