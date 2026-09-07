import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  ArrowRight,
  Flame,
  Coffee,
  Wine,
  Utensils,
  CheckCircle2,
  AlertCircle,
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
        alert('Please upload a valid receipt image (JPG, PNG, or WEBP).');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Hero section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vibe Coding Challenge Edition — Indian Dining Splitter</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Snap. Assign. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Split.</span>
        </h1>
        <p className="max-w-xl mx-auto text-slate-400 text-sm sm:text-base">
          Upload any restaurant bill photograph. Our AI extracts dishes, GST (CGST + SGST), and service charges, lets you review every line, and calculates fair per-person shares.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all p-8 sm:p-12 text-center ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-white">
              Drag & drop your restaurant bill photograph here
            </p>
            <p className="text-xs text-slate-400">
              Supports JPEG, PNG, WEBP receipt photos from camera or gallery
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20"
          >
            Browse Receipt File
          </button>
        </div>
      </div>

      {/* 1-Click Indian Demo Sample Bills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Or Try 1-Click Demo Receipts (₹ INR)
            </h2>
          </div>
          <span className="text-xs text-slate-500">Instant judge walkthrough</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleBillsList.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="group cursor-pointer rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 transition-all hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                    {sample.id === 'punjab_grill' && <Utensils className="w-5 h-5" />}
                    {sample.id === 'social_cafe' && <Wine className="w-5 h-5" />}
                    {sample.id === 'saravana_bhavan' && <Coffee className="w-5 h-5" />}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 border border-transparent group-hover:border-emerald-500/20 transition-all">
                    {sample.items.length} Items
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                    {sample.restaurant_name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {sample.notes}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                    Bill Total
                  </span>
                  <span className="text-base font-bold text-white font-mono-nums">
                    {formatCurrency(sample.total, sample.currency)}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature highlights badge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Multimodal Gemini 2.5 OCR</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Indian GST & Service Charge Math</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Zero Penny Rounding Discrepancy</span>
        </div>
      </div>
    </div>
  );
}
