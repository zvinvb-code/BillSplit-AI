import React from 'react';
import { X, UploadCloud, FileCheck2, Users, Calculator, CheckCircle2 } from 'lucide-react';

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const steps = [
    {
      number: '1',
      title: 'Upload Bill',
      icon: UploadCloud,
      description: 'Snap a photograph of any restaurant receipt, upload an image file (JPG/PNG), or test with pre-loaded Indian dining sample receipts.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      number: '2',
      title: 'Review Details',
      icon: FileCheck2,
      description: 'Our Google Gemini 2.5 Flash Vision AI extracts line items, quantities, prices, taxes, and service charges with confidence scores. Review and tweak as needed.',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      number: '3',
      title: 'Assign Dishes',
      icon: Users,
      description: 'Add your dining friends and select who ate what. Easily assign single items, shared starters across multiple people, or split items table-wide.',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      number: '4',
      title: 'Split & Reconcile',
      icon: Calculator,
      description: 'The engine calculates proportional GST tax, service charge, and discounts per person. Zero-penny discrepancy reconciliation guarantees accuracy.',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>How BillSplit AI Works</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Snap. Assign. Split. — 4 Simple Steps to Fair Dining Splits</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Grid */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border ${step.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Step {step.number}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Core Philosophy Banner */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-900 font-medium">
              <span className="font-bold">Proportional Fairness:</span> Overheads (GST, Service Charge & Discounts) are automatically weighted by each diner’s actual food spend, so non-drinkers never subsidize expensive meals!
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm rounded-xl shadow-xs transition-all"
          >
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  );
}
