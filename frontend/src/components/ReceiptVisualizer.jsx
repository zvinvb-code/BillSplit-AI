import React from 'react';
import { Receipt, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function ReceiptVisualizer({ bill, customImageSrc }) {
  if (customImageSrc) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-900/80 group">
        <div className="max-h-[560px] overflow-y-auto flex items-center justify-center p-2">
          <img
            src={customImageSrc}
            alt="Uploaded Bill"
            className="w-full h-auto object-contain rounded-xl shadow-md"
          />
        </div>
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 flex items-center gap-2 text-xs text-slate-300">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Uploaded Photograph</span>
        </div>
      </div>
    );
  }

  // Realistic Indian Restaurant Thermal Bill Mockup
  const currency = bill?.currency || '₹';

  return (
    <div className="relative mx-auto max-w-sm rounded-xl overflow-hidden shadow-2xl bg-[#faf8f5] text-slate-900 border border-amber-200/50 font-mono-nums select-none transition-transform">
      {/* Thermal receipt top serrated edge */}
      <div className="h-3 bg-slate-950 flex overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 bg-[#faf8f5] rotate-45 transform -translate-y-2 -translate-x-1"
          />
        ))}
      </div>

      <div className="p-6 text-xs text-slate-800 space-y-4">
        {/* Header */}
        <div className="text-center border-b border-dashed border-slate-400/60 pb-3">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-amber-400 mb-1.5">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-slate-950 uppercase tracking-wider font-sans">
            {bill?.restaurant_name || 'RESTAURANT & CAFE'}
          </h3>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
            TAX INVOICE / GUEST BILL
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            GSTIN: 27AABCP1234D1Z9
          </p>
          <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
            <span>Date: Today</span>
            <span>Table: 04</span>
          </div>
        </div>

        {/* Item List Header */}
        <div className="border-b border-dashed border-slate-400/60 pb-1">
          <div className="grid grid-cols-12 font-bold text-slate-900 text-[11px] pb-1 uppercase tracking-wide">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-4 text-right">Amt ({currency})</span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {(bill?.items || []).map((item, idx) => (
            <div key={item.id || idx} className="grid grid-cols-12 text-[11px] text-slate-700 leading-snug">
              <span className="col-span-6 font-medium text-slate-900 truncate">
                {item.name}
              </span>
              <span className="col-span-2 text-center font-mono">
                {item.quantity}
              </span>
              <span className="col-span-4 text-right font-mono font-semibold text-slate-950">
                {Number(item.total).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Subtotal & Taxes Breakdown */}
        <div className="border-t border-dashed border-slate-400/60 pt-2.5 space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(bill?.subtotal, currency)}
            </span>
          </div>

          {bill?.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(bill?.discount, currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>CGST (2.5%)</span>
            <span className="font-mono">
              {formatCurrency(bill?.tax ? bill.tax / 2 : 0, currency)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>SGST (2.5%)</span>
            <span className="font-mono">
              {formatCurrency(bill?.tax ? bill.tax / 2 : 0, currency)}
            </span>
          </div>

          {bill?.service_charge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Service Charge</span>
              <span className="font-mono">
                {formatCurrency(bill?.service_charge, currency)}
              </span>
            </div>
          )}

          {/* Grand Total */}
          <div className="border-t-2 border-slate-900 pt-2 mt-2 flex justify-between items-baseline font-bold text-sm text-slate-950">
            <span>GRAND TOTAL</span>
            <span className="text-base font-mono text-emerald-800">
              {formatCurrency(bill?.total, currency)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-300">
          <p className="font-sans font-medium text-slate-700">THANK YOU FOR DINING WITH US!</p>
          <p className="font-mono mt-0.5 text-[9px]">BillSplit AI Verified Extraction</p>
        </div>
      </div>

      {/* Serrated bottom edge */}
      <div className="h-3 bg-slate-950 flex overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 bg-[#faf8f5] rotate-45 transform translate-y-1 -translate-x-1"
          />
        ))}
      </div>
    </div>
  );
}
