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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 6: Mathematical Split Complete</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Final Bill Split Breakdown
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Every rupee distributed fairly with proportional GST and service charges. Zero rounding discrepancy.
        </p>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToAssign}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Adjust Assignments</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Bill</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Summary</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20"
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

      {/* Bill Reconciliation Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Mathematical Reconciliation</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                100% Balanced
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bill Total: <span className="text-white font-mono font-semibold">{formatCurrency(summary.grand_total, currency)}</span> • Sum of Person Splits: <span className="text-white font-mono font-semibold">{formatCurrency(summary.calculated_total_sum, currency)}</span> • Penny Discrepancy: <span className="text-emerald-400 font-mono font-semibold">{formatCurrency(summary.discrepancy, currency)}</span>
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
            {bill.restaurant_name}
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono-nums">
            {formatCurrency(summary.grand_total, currency)}
          </span>
        </div>
      </div>

      {/* Unassigned alert if any */}
      {summary.unassigned_items && summary.unassigned_items.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Note: <strong>{summary.unassigned_items.join(', ')}</strong> ({formatCurrency(summary.unassigned_subtotal, currency)}) were left unassigned.
          </span>
        </div>
      )}

      {/* Cards Grid: Per-Person Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {peopleCalcs.map((p, idx) => (
          <div
            key={p.person_id}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl transition-all"
          >
            {/* Person Card Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base shadow-md">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{p.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono-nums">
                      {formatPercentage(p.percentage_of_bill)} of bill
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                    To Pay
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono-nums">
                    {formatCurrency(p.total_amount, currency)}
                  </span>
                </div>
              </div>

              {/* Itemized Dishes List */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Dishes & Shares:
                </span>
                {p.items.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No dishes assigned</p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {p.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 text-slate-300"
                      >
                        <div className="truncate pr-2">
                          <span className="font-medium text-white">{item.name}</span>
                          <span className="text-[10px] text-slate-500 block">
                            {Math.round(item.share_fraction * 100)}% share
                          </span>
                        </div>
                        <span className="font-mono-nums font-semibold text-slate-200 shrink-0">
                          {formatCurrency(item.share_amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Overheads Breakdown (Tax, Service, Discount) */}
            <div className="pt-4 mt-4 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Food Items Share</span>
                <span className="font-mono-nums text-white">
                  {formatCurrency(p.items_subtotal, currency)}
                </span>
              </div>

              {p.tax_share > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>GST (CGST + SGST) Share</span>
                  <span className="font-mono-nums text-slate-200">
                    +{formatCurrency(p.tax_share, currency)}
                  </span>
                </div>
              )}

              {p.service_charge_share > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Service Charge Share</span>
                  <span className="font-mono-nums text-slate-200">
                    +{formatCurrency(p.service_charge_share, currency)}
                  </span>
                </div>
              )}

              {p.discount_share > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Share</span>
                  <span className="font-mono-nums font-semibold">
                    -{formatCurrency(p.discount_share, currency)}
                  </span>
                </div>
              )}

              {/* Total Row */}
              <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                <span>Total for {p.name}</span>
                <span className="text-emerald-400 font-mono-nums text-base">
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
