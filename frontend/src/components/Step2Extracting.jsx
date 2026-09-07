import React, { useEffect, useState } from 'react';
import { Sparkles, Scan, CheckCircle, Loader2 } from 'lucide-react';
import ReceiptVisualizer from './ReceiptVisualizer';

const STAGES = [
  { label: 'Normalizing receipt photograph and enhancing contrast...', duration: 700 },
  { label: 'Gemini AI reading menu items, quantities & unit prices...', duration: 900 },
  { label: 'Parsing GST breakdown (CGST + SGST), discounts & service charge...', duration: 700 },
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Multimodal Vision Engine Active</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Extracting Bill Information...
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Analyzing food items, prices, and Indian tax breakdown from your receipt
        </p>
      </div>

      {/* Visual Scanner Box with Laser Line */}
      <div className="relative max-w-sm mx-auto rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 bg-slate-900/60 p-4">
        {/* Animated Laser Beam */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] z-20 animate-scanline pointer-events-none" />

        {/* Receipt underneath scanner */}
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
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                  : isCurrent
                  ? 'bg-slate-900 border-emerald-500/50 text-white shadow-lg'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              {isDone ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className={isCurrent ? 'font-medium text-emerald-300' : ''}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
