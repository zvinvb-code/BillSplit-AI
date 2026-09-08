import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import ReceiptVisualizer from './ReceiptVisualizer';

const STAGES = [
  { label: 'Preprocessing receipt image & enhancing contrast...', duration: 700 },
  { label: 'Gemini AI reading line items, quantities & unit prices...', duration: 900 },
  { label: 'Parsing GST tax breakdown, discounts & service charges...', duration: 700 },
  { label: 'Validating mathematical totals & field confidence scores...', duration: 600 },
];

export default function Step2Extracting({ previewImage, sampleBillData }) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const intervals = [700, 1600, 2300];
    const timers = intervals.map((delay, index) =>
      setTimeout(() => {
        setActiveStage(index + 1);
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multimodal Vision AI Processing</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Extracting Bill Information...
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Parsing food items, quantities, prices, and tax details from your receipt
        </p>
      </div>

      {/* Visual Scanner Box with Subtle Laser Line */}
      <div className="relative max-w-sm mx-auto rounded-2xl overflow-hidden border border-emerald-300 shadow-md bg-white p-4">
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-xs z-20 animate-scanline pointer-events-none" />

        <div className="opacity-90 blur-[0.5px] scale-95 pointer-events-none">
          <ReceiptVisualizer bill={sampleBillData} customImageSrc={previewImage} />
        </div>
      </div>

      {/* Progress Stages */}
      <div className="max-w-md mx-auto space-y-2.5">
        {STAGES.map((stage, idx) => {
          const isDone = activeStage > idx;
          const isCurrent = activeStage === idx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-xs ${
                isDone
                  ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                  : isCurrent
                  ? 'bg-white border-emerald-500 text-emerald-900 shadow-xs font-medium'
                  : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className={isCurrent ? 'font-semibold text-emerald-800' : ''}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
