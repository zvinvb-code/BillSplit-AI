import React from 'react';
import {
  UploadCloud,
  Sparkles,
  FileCheck2,
  Users,
  UtensilsCrossed,
  Calculator,
  Check,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Upload Bill', shortLabel: 'Upload', icon: UploadCloud },
  { id: 2, label: 'AI Scan', shortLabel: 'Scan', icon: Sparkles },
  { id: 3, label: 'Review & Edit', shortLabel: 'Review', icon: FileCheck2 },
  { id: 4, label: 'Add Friends', shortLabel: 'Friends', icon: Users },
  { id: 5, label: 'Assign Items', shortLabel: 'Assign', icon: UtensilsCrossed },
  { id: 6, label: 'Final Split', shortLabel: 'Split', icon: Calculator },
];

export default function StepIndicator({ currentStep, maxCompletedStep, onStepClick }) {
  return (
    <div className="w-full py-4 border-b border-slate-800/60 bg-slate-950/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between relative">
          {/* Connector Line behind steps */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-800 -z-0">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, ((currentStep - 1) / (STEPS.length - 1)) * 100)}%`,
              }}
            />
          </div>

          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCurrent = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isClickable = step.id <= Math.max(currentStep, maxCompletedStep);

            return (
              <button
                key={step.id}
                disabled={!isClickable || step.id === 2} // Step 2 is active scanner
                onClick={() => isClickable && onStepClick(step.id)}
                className={`relative z-10 flex flex-col items-center group focus:outline-none transition-all ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {/* Circle Badge */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 font-bold ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30 scale-105'
                      : isCompleted
                      ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-500 border border-slate-800 group-hover:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`mt-2 text-[11px] font-medium tracking-tight transition-colors hidden sm:block ${
                    isCurrent
                      ? 'text-emerald-400 font-semibold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>

                {/* Mobile short label */}
                <span
                  className={`mt-1.5 text-[10px] font-medium sm:hidden ${
                    isCurrent ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {step.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
