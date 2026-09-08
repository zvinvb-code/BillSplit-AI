import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Check,
  Percent,
  X,
  Plus,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import {
  validatePeopleCount,
  getUnassignedBillItems,
  computeRawItemShares,
} from '../types/assignment';

const PRESET_NAMES = ['Rahul', 'Ananya', 'You', 'Sneha', 'Rohan', 'Priya', 'Kabir', 'Aarav'];

const COLOR_PALETTE = [
  '#059669', // emerald
  '#4f46e5', // indigo
  '#d97706', // amber
  '#db2777', // pink
  '#0891b2', // cyan
  '#7c3aed', // violet
  '#2563eb', // blue
  '#ea580c', // orange
  '#0d9488', // teal
  '#e11d48', // rose
];

export default function Step5Assign({
  bill,
  people,
  assignments,
  taxSplitMethod,
  onChangeTaxSplitMethod,
  onUpdatePeople,
  onToggleAssignment,
  onAssignToAll,
  onClearAssignment,
  onAssignAllUnassignedToEveryone,
  onCalculate,
  onBack,
  isCalculating,
}) {
  const currency = bill.currency || '₹';
  const [newPersonName, setNewPersonName] = useState('');

  const isMaxPeople = people.length >= 10;

  const handleAddPerson = (nameToAdd) => {
    const name = (nameToAdd || newPersonName).trim();
    if (!name) return;
    if (people.length >= 10) {
      alert('Maximum 10 people allowed per split.');
      return;
    }
    if (people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      alert(`"${name}" is already in the group.`);
      return;
    }

    const nextColor = COLOR_PALETTE[people.length % COLOR_PALETTE.length];
    const newPerson = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      color: nextColor,
    };

    onUpdatePeople([...people, newPerson]);
    setNewPersonName('');
  };

  const handleRemovePerson = (personId) => {
    if (people.length <= 1) {
      alert('At least 1 person is required to split the bill.');
      return;
    }
    const updatedPeople = people.filter((p) => p.id !== personId);
    onUpdatePeople(updatedPeople);
  };

  // Unassigned Items Detection
  const unassignedItems = useMemo(() => {
    return getUnassignedBillItems(bill.items || [], assignments);
  }, [bill.items, assignments]);

  const hasUnassigned = unassignedItems.length > 0;

  // Running Food Subtotals per Person
  const runningShares = useMemo(() => {
    const { personSubtotals } = computeRawItemShares(bill.items || [], people, assignments);
    const result = {};
    (people || []).forEach((p) => {
      let itemsCount = 0;
      (bill.items || []).forEach((it) => {
        if ((assignments[it.id] || []).includes(p.id)) {
          itemsCount++;
        }
      });
      result[p.id] = {
        totalFoodShare: personSubtotals[p.id] || 0,
        itemsCount,
      };
    });
    return result;
  }, [bill.items, assignments, people]);

  const totalFoodAssignedSum = useMemo(() => {
    return Object.values(runningShares).reduce((acc, curr) => acc + (curr.totalFoodShare || 0), 0);
  }, [runningShares]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Add People & Assign Items
            </h1>
          </div>
          <p className="text-xs text-slate-600">
            Select who ate or shared each line item. Overheads (GST tax, service charges, discounts) will be split proportionally.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            ← Back to Review
          </button>
          <button
            onClick={onCalculate}
            disabled={isCalculating}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs tracking-wide shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <span>Calculating Split...</span>
            ) : (
              <>
                <span>Calculate Split</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning Banner if Unassigned Items */}
      {hasUnassigned && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">
                {unassignedItems.length} item{unassignedItems.length > 1 ? 's' : ''} unassigned:
              </span>{' '}
              {unassignedItems.map((i) => i.name).join(', ')}
            </div>
          </div>
          <button
            onClick={onAssignAllUnassignedToEveryone}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap transition-colors shadow-2xs"
          >
            Assign Unassigned to Everyone
          </button>
        </div>
      )}

      {/* TOP SECTION: People Management Cards & Presets */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Dining Group</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {people.length} People
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add people sharing this bill. Click selection chips below to assign dishes.
            </p>
          </div>

          {/* Add Person Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddPerson();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="Person name..."
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white w-40"
              maxLength={20}
            />
            <button
              type="submit"
              disabled={isMaxPeople || !newPersonName.trim()}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Quick Preset Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
            Quick Presets:
          </span>
          {PRESET_NAMES.map((name) => {
            const exists = people.some((p) => p.name.toLowerCase() === name.toLowerCase());
            return (
              <button
                key={name}
                disabled={exists || isMaxPeople}
                onClick={() => handleAddPerson(name)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  exists
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                + {name}
              </button>
            );
          })}
        </div>

        {/* People Grid Cards with Running Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
          {people.map((p) => {
            const pShare = runningShares[p.id] || { totalFoodShare: 0, itemsCount: 0 };
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[80px]">
                      {p.name}
                    </span>
                  </div>
                  {people.length > 1 && (
                    <button
                      onClick={() => handleRemovePerson(p.id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded"
                      title={`Remove ${p.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-200/60 flex items-baseline justify-between text-[11px]">
                  <span className="text-slate-400">Items ({pShare.itemsCount})</span>
                  <span className="font-bold text-slate-900 font-mono-nums">
                    {formatCurrency(pShare.totalFoodShare, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN SECTION: Bill Items Selection Chips */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Assign Line Items ({bill.items.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click a person's chip to toggle their share for that dish.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Tax Method:</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => onChangeTaxSplitMethod('proportional')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  taxSplitMethod === 'proportional'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Proportional %
              </button>
              <button
                onClick={() => onChangeTaxSplitMethod('equal')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  taxSplitMethod === 'equal'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Equal Split
              </button>
            </div>
          </div>
        </div>

        {/* Bill Items Assignment Cards */}
        <div className="space-y-3">
          {(bill.items || []).map((item, idx) => {
            const itemAssignments = assignments[item.id] || [];
            const isAssigned = itemAssignments.length > 0;
            const splitCount = itemAssignments.length;
            const perPersonShare = splitCount > 0 ? (item.total / splitCount) : item.total;

            return (
              <div
                key={item.id || idx}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isAssigned
                    ? 'bg-white border-slate-200 shadow-2xs'
                    : 'bg-amber-50/40 border-amber-200/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {item.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Line Total: {formatCurrency(item.total, currency)}
                      {splitCount > 1 && (
                        <span className="text-emerald-700 font-semibold ml-2">
                          ({formatCurrency(perPersonShare, currency)} each for {splitCount} people)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Batch Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAssignToAll(item.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Assign All
                    </button>
                    {isAssigned && (
                      <button
                        onClick={() => onClearAssignment(item.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Selection Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  {people.map((p) => {
                    const isPersonAssigned = itemAssignments.includes(p.id);

                    return (
                      <button
                        key={p.id}
                        onClick={() => onToggleAssignment(item.id, p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isPersonAssigned
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span>{p.name}</span>
                        {isPersonAssigned && <Check className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <h3 className="text-sm font-bold text-slate-900">
            Ready to Split?
          </h3>
          <p className="text-xs text-slate-500">
            Click calculate to get itemized breakdowns and proportional GST distribution.
          </p>
        </div>

        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm tracking-wide shadow-xs transition-all disabled:opacity-50"
        >
          {isCalculating ? 'Calculating...' : 'Calculate Split →'}
        </button>
      </div>
    </div>
  );
}
