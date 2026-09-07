import React, { useState } from 'react';
import { Users, UserPlus, Trash2, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';

const PRESET_NAMES = [
  'Rahul',
  'Ananya',
  'Me',
  'Sneha',
  'Rohan',
  'Kabir',
  'Priya',
  'Aarav',
];

const COLOR_PALETTE = [
  { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', dot: 'bg-emerald-400', hex: '#10b981' },
  { bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40', dot: 'bg-indigo-400', hex: '#6366f1' },
  { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', dot: 'bg-amber-400', hex: '#f59e0b' },
  { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40', dot: 'bg-rose-400', hex: '#f43f5e' },
  { bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40', dot: 'bg-cyan-400', hex: '#06b6d4' },
  { bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40', dot: 'bg-purple-400', hex: '#a855f7' },
  { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40', dot: 'bg-blue-400', hex: '#3b82f6' },
  { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40', dot: 'bg-orange-400', hex: '#f97316' },
];

export default function Step4People({
  people,
  onUpdatePeople,
  onNext,
  onBack,
}) {
  const [nameInput, setNameInput] = useState('');

  const handleAddPerson = (nameToAdd) => {
    const trimmed = (nameToAdd || nameInput).trim();
    if (!trimmed) return;

    if (people.length >= 10) {
      alert('Maximum 10 people allowed per split.');
      return;
    }

    // Check duplicate
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`"${trimmed}" is already added.`);
      return;
    }

    const colorIndex = people.length % COLOR_PALETTE.length;
    const newPerson = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      color: COLOR_PALETTE[colorIndex].hex,
    };

    onUpdatePeople([...people, newPerson]);
    setNameInput('');
  };

  const handleRemovePerson = (id) => {
    onUpdatePeople(people.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>Step 4: Group Configuration</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Who's Splitting This Bill?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Add the friends who dined together. In the next step, you can assign dishes to one or multiple people.
        </p>
      </div>

      {/* Input Form */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPerson();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Type friend's name (e.g. Aarav, Priya...)"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Friend</span>
          </button>
        </form>

        {/* Quick Add Presets */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Quick Add Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_NAMES.map((name) => {
              const isAlreadyAdded = people.some(
                (p) => p.name.toLowerCase() === name.toLowerCase()
              );

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => !isAlreadyAdded && handleAddPerson(name)}
                  disabled={isAlreadyAdded}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isAlreadyAdded
                      ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-default'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {isAlreadyAdded && <Check className="w-3 h-3 text-emerald-400" />}
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* People List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Friends ({people.length})
          </h3>
          {people.length === 0 && (
            <span className="text-xs text-amber-400">
              Please add at least 1 person to continue
            </span>
          )}
        </div>

        {people.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-500 text-xs">
            No friends added yet. Type a name or click a preset above!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {people.map((p, idx) => {
              const palette = COLOR_PALETTE[idx % COLOR_PALETTE.length];

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${palette.bg}`}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                      <span className="text-[10px] text-slate-500">Friend #{idx + 1}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemovePerson(p.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title={`Remove ${p.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Review</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={people.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
        >
          <span>Proceed to Assign Items</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
