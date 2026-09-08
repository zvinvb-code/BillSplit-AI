import React from 'react';
import { UploadCloud, FileCheck2, Users, Calculator, Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Upload', number: '1', icon: UploadCloud },
  { id: 2, label: 'Review', number: '2', icon: FileCheck2 },
  { id: 3, label: 'Assign', number: '3', icon: Users },
  { id: 4, label: 'Split', number: '4', icon: Calculator },
];

export default function StepIndicator({ currentStep, maxCompletedStep, onStepClick }) {
  return (
    <div className="w-full py-4 border-b border-slate-200 bg-white/80 backdrop-blur-xs">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between relative">
          {/* Progress Connector Line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0">
            <div
              className="h-full bg-emerald-600 transition-all duration-500 ease-out"
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
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.id)}
                className={`relative z-10 flex flex-col items-center group focus:outline-none transition-all ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100 scale-105'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:border-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <div className="flex items-center gap-1">
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`mt-2 text-xs font-medium tracking-tight transition-colors ${
                    isCurrent
                      ? 'text-emerald-700 font-bold'
                      : isCompleted
                      ? 'text-slate-900 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {step.number} {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
