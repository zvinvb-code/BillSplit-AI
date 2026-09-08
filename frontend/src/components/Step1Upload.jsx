import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  ArrowRight,
  Utensils,
  Wine,
  Coffee,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { SAMPLE_BILLS_DATA } from '../data/sampleBills';
import { formatCurrency } from '../utils/formatters';

export default function Step1Upload({ onFileUpload, onSelectSample }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileUpload(file);
      } else {
        alert('Please upload a valid receipt image (JPG or PNG up to 10MB).');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const sampleBillsList = Object.values(SAMPLE_BILLS_DATA);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Header section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multimodal Vision AI Powered</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Snap your bill
        </h1>
        <p className="max-w-lg mx-auto text-slate-600 text-sm sm:text-base leading-relaxed">
          Upload a restaurant bill and we'll extract the details.
        </p>
      </div>

      {/* Large Drag-and-Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all p-10 sm:p-14 text-center ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-emerald-500 hover:bg-slate-50/50 shadow-xs hover:shadow-md'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">
              Snap your bill
            </h3>
            <p className="text-sm text-slate-600">
              Upload a restaurant bill and we'll extract the details.
            </p>
          </div>

          <button
            type="button"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm tracking-wide transition-all shadow-sm"
          >
            Upload Bill
          </button>

          <p className="text-xs text-slate-400 font-medium">
            JPG, PNG up to 10MB
          </p>
        </div>
      </div>

      {/* 1-Click Demo Receipts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Or test with sample receipts (₹ INR)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">1-Click instant test</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleBillsList.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="group cursor-pointer rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {sample.id === 'punjab_grill' && <Utensils className="w-5 h-5" />}
                    {sample.id === 'social_cafe' && <Wine className="w-5 h-5" />}
                    {sample.id === 'saravana_bhavan' && <Coffee className="w-5 h-5" />}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    {sample.items.length} items
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                    {sample.restaurant_name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {sample.notes}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Bill Total
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono-nums">
                    {formatCurrency(sample.total, sample.currency)}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Multimodal Gemini 2.5 OCR</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>GST & Service Charge Split</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero-Penny Discrepancy Math</span>
        </div>
      </div>
    </div>
  );
}
