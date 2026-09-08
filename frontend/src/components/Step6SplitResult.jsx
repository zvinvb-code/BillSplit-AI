import React, { useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Printer,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  User,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default function Step6SplitResult({
  splitResult,
  bill,
  people,
  onBackToAssign,
  onReset,
}) {
  const [copied, setCopied] = useState(false);
  const currency = splitResult?.summary?.currency || bill?.currency || '₹';

  const { people_calculations: peopleCalcs, summary } = splitResult;

  const isReconciled = summary && Math.abs(summary.discrepancy || 0) < 0.01 && (!summary.unassigned_items || summary.unassigned_items.length === 0);

  // Format WhatsApp / UPI friendly text
  const generateWhatsAppText = () => {
    const lines = [];
    lines.push(`🧾 *BillSplit AI Breakdown — ${bill.restaurant_name || 'Restaurant'}*`);
    lines.push(`💰 Grand Total: ${formatCurrency(summary.grand_total, currency)}`);
    lines.push(`🗓️ Date: ${new Date().toLocaleDateString('en-IN')}`);
    lines.push(``);
    lines.push(`*Per-Person Split:*`);

    peopleCalcs.forEach((p) => {
      lines.push(`────────────────────`);
      lines.push(`👤 *${p.name}*: *${formatCurrency(p.total_amount, currency)}* (${formatPercentage(p.percentage_of_bill)})`);
      lines.push(`   • Items: ${formatCurrency(p.items_subtotal, currency)}`);
      if (p.tax_share > 0) lines.push(`   • GST Share: +${formatCurrency(p.tax_share, currency)}`);
      if (p.service_charge_share > 0) lines.push(`   • Service Charge: +${formatCurrency(p.service_charge_share, currency)}`);
      if (p.discount_share > 0) lines.push(`   • Discount: -${formatCurrency(p.discount_share, currency)}`);

      if (p.items.length > 0) {
        lines.push(`   🍽️ Dishes: ${p.items.map((it) => `${it.name} (${Math.round(it.share_fraction * 100)}%)`).join(', ')}`);
      }
    });

    lines.push(`────────────────────`);
    lines.push(`✅ Reconciliation Check: Sum = ${formatCurrency(summary.calculated_total_sum, currency)} (Diff: ${formatCurrency(summary.discrepancy, currency)})`);
    lines.push(`Generated with BillSplit AI 🚀`);

    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 print:p-0 print:text-black">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mathematical Split Complete</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Final Bill Split Breakdown
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Every rupee distributed fairly with proportional GST and service charges. Zero rounding discrepancy.
        </p>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToAssign}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Adjust Assignments</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Bill</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Summary</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs tracking-wide transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copy WhatsApp / UPI Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bill Hero Summary & Reconciliation Badge */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-slate-900">
              {bill.restaurant_name || 'Restaurant Receipt'}
            </h3>
            {/* Reconciliation Badge */}
            {isReconciled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Total reconciled ✓</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Total mismatch detected ⚠</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 font-mono">
            Calculated Sum: <span className="text-slate-900 font-semibold">{formatCurrency(summary.calculated_total_sum, currency)}</span> • Printed Total: <span className="text-slate-900 font-semibold">{formatCurrency(summary.grand_total, currency)}</span> • Reconciled Discrepancy: <span className="text-emerald-700 font-semibold">{formatCurrency(summary.discrepancy, currency)}</span>
          </p>
        </div>

        {/* Total Bill Hero Display */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left md:text-right shrink-0 min-w-[200px]">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            Total Bill
          </span>
          <span className="text-3xl font-black text-slate-900 font-mono-nums">
            {formatCurrency(summary.grand_total, currency)}
          </span>
        </div>
      </div>

      {/* Unassigned alert if any */}
      {summary.unassigned_items && summary.unassigned_items.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Note: <strong>{summary.unassigned_items.join(', ')}</strong> ({formatCurrency(summary.unassigned_subtotal, currency)}) were left unassigned.
          </span>
        </div>
      )}

      {/* Hero People Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {peopleCalcs.map((p) => (
          <div
            key={p.person_id}
            className="rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all space-y-6"
          >
            {/* Card Header: Person & Total Amount */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-2xs"
                    style={{ backgroundColor: p.color || '#059669' }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                    <span className="text-xs text-slate-500 font-mono-nums">
                      {formatPercentage(p.percentage_of_bill)} of total
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    Amount
                  </span>
                  <span className="text-xl font-extrabold text-emerald-700 font-mono-nums">
                    {formatCurrency(p.total_amount, currency)}
                  </span>
                </div>
              </div>

              {/* Itemized Dishes List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Dishes & Shares:
                </span>
                {p.items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No dishes assigned</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {p.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-100 text-slate-700"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          <span className="text-[10px] text-slate-500 block">
                            {Math.round(item.share_fraction * 100)}% share
                          </span>
                        </div>
                        <span className="font-mono-nums font-semibold text-slate-900 shrink-0">
                          {formatCurrency(item.share_amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Overheads Breakdown (Tax, Service, Discount) */}
            <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Food Items Share</span>
                <span className="font-mono-nums font-semibold text-slate-900">
                  {formatCurrency(p.items_subtotal, currency)}
                </span>
              </div>

              {p.tax_share > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax Share</span>
                  <span className="font-mono-nums">
                    +{formatCurrency(p.tax_share, currency)}
                  </span>
                </div>
              )}

              {p.service_charge_share > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge Share</span>
                  <span className="font-mono-nums">
                    +{formatCurrency(p.service_charge_share, currency)}
                  </span>
                </div>
              )}

              {p.discount_share > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount Share</span>
                  <span className="font-mono-nums font-semibold">
                    -{formatCurrency(p.discount_share, currency)}
                  </span>
                </div>
              )}

              {/* Total Row */}
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Total for {p.name}</span>
                <span className="text-emerald-700 font-mono-nums text-base">
                  {formatCurrency(p.total_amount, currency)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
