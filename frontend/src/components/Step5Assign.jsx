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

const PRESET_NAMES = ['Rahul', 'Ananya', 'Me', 'Sneha', 'Rohan', 'Kabir', 'Priya', 'Aarav'];

const COLOR_PALETTE = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#f97316', // orange
  '#14b8a6', // teal
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

  // 1. Validation & People limits (1 to 10 people)
  const isMaxPeople = people.length >= 10;
  const isMinPeople = people.length <= 1;

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
    // Remove person and remove their ID from any assignments
    const updatedPeople = people.filter((p) => p.id !== personId);
    onUpdatePeople(updatedPeople);

    // Filter assignments
    Object.keys(assignments).forEach((itemId) => {
      if ((assignments[itemId] || []).includes(personId)) {
        onToggleAssignment(itemId, personId);
      }
    });
  };

  // 2. Unassigned Items Detection
  const unassignedItems = useMemo(() => {
    return getUnassignedBillItems(bill.items, assignments, people);
  }, [bill.items, assignments, people]);

  const hasUnassigned = unassignedItems.length > 0;

  // 3. Raw Item Shares Computation (NO tax/service charge at this stage)
  const { personSubtotals, totalAssignedAmount } = useMemo(() => {
    return computeRawItemShares(bill.items, people, assignments);
  }, [bill.items, people, assignments]);

  const allItemsAssigned = !hasUnassigned && bill.items.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Who&apos;s eating?
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700">
              {people.length} / 10 People
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Add 1 to 10 friends, then assign every dish to one person, multiple people, or everyone.
          </p>
        </div>

        {/* Top CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCalculate}
            disabled={!allItemsAssigned || isCalculating}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg ${
              allItemsAssigned
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
            }`}
            title={allItemsAssigned ? 'Proceed to Final Split' : 'Assign all items to calculate'}
          >
            <span>Calculate Split</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* People Management Section (1 to 10 people) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Dining Group ({people.length} People)
            </h2>
            {isMaxPeople && (
              <span className="text-[11px] text-amber-400 font-medium">
                (Maximum 10 people reached)
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            Min 1 • Max 10 friends
          </span>
        </div>

        {/* Add Person Input & Presets */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddPerson();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              disabled={isMaxPeople}
              placeholder={isMaxPeople ? 'Max 10 people reached' : 'Type friend name (e.g. Rahul, Ananya, Me)...'}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isMaxPeople || !newPersonName.trim()}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Person</span>
            </button>
          </form>

          {/* Quick Presets */}
          {!isMaxPeople && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mr-1">
                Quick Add:
              </span>
              {PRESET_NAMES.map((name) => {
                const alreadyAdded = people.some((p) => p.name.toLowerCase() === name.toLowerCase());
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => !alreadyAdded && handleAddPerson(name)}
                    disabled={alreadyAdded || isMaxPeople}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      alreadyAdded
                        ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-default'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    + {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active People Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {people.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white group hover:border-slate-600 transition-all"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: p.color || '#10b981' }}
              />
              <span className="font-semibold">{p.name}</span>
              {!isMinPeople && (
                <button
                  type="button"
                  onClick={() => handleRemovePerson(p.id)}
                  className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title={`Remove ${p.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Helpful Error Banner for Unassigned Items */}
      {hasUnassigned && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2 text-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 text-sm block">
                  Cannot Calculate Split: {unassignedItems.length} {unassignedItems.length === 1 ? 'item is' : 'items are'} unassigned
                </span>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  Every bill item must be assigned to at least one person before calculating the final split.
                </p>
                <p className="text-[11px] text-amber-300/80 font-mono mt-1">
                  Unassigned: {unassignedItems.map((it) => it.name).join(', ')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onAssignAllUnassignedToEveryone}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-md shrink-0 self-start sm:self-center"
            >
              Split Unassigned with Everyone
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Items Assignment Cards, Right Live Food Shares Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Every Bill Item Card */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Every Bill Item ({bill.items.length})
            </h2>
            <span className="text-xs text-slate-400 font-mono-nums">
              Food Assigned: {formatCurrency(totalAssignedAmount, currency)} / {formatCurrency(bill.subtotal || 0, currency)}
            </span>
          </div>

          <div className="space-y-3.5">
            {bill.items.map((item) => {
              const assignedIds = (assignments[item.id] || []).filter((id) =>
                people.some((p) => p.id === id)
              );
              const numAssigned = assignedIds.length;
              const isAssigned = numAssigned > 0;
              const isEveryone = numAssigned === people.length && people.length > 0;

              // Quantity & Unit price math
              const sharePerPerson = isAssigned ? Math.round((item.total / numAssigned) * 100) / 100 : 0;
              const shareQty = isAssigned ? Math.round((item.quantity / numAssigned) * 100) / 100 : 0;

              const assignedNames = assignedIds
                .map((id) => people.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(', ');

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isAssigned
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                      : 'bg-amber-950/15 border-amber-500/40 shadow-sm'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {item.name}
                        </h3>
                        {/* Quantity & Unit Price Spec */}
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono-nums font-semibold bg-slate-950 text-slate-300 border border-slate-800">
                          qty = {item.quantity} • unit = {formatCurrency(item.unit_price, currency)}
                        </span>
                      </div>

                      {/* Division Result Description */}
                      <div className="pt-0.5">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono-nums">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isEveryone
                              ? `Everyone (${numAssigned} people) → ${formatCurrency(sharePerPerson, currency)} each`
                              : numAssigned === 1
                              ? `100% to ${assignedNames} → ${formatCurrency(item.total, currency)}`
                              : `Split ${numAssigned} ways (${assignedNames}) → ${formatCurrency(sharePerPerson, currency)} each`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unassigned — choose who ate this dish
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-lg font-black text-white font-mono-nums">
                        {formatCurrency(item.total, currency)}
                      </span>

                      {isAssigned && (
                        <button
                          type="button"
                          onClick={() => onClearAssignment(item.id)}
                          className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors px-1"
                          title="Clear assignments"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-Way Selection Controls: 1. One person, 2. Multiple people, 3. Everyone */}
                  <div className="pt-3.5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assign dish to:
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Option 3: Everyone Shortcut Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isEveryone) {
                            onClearAssignment(item.id);
                          } else {
                            onAssignToAll(item.id);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isEveryone
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400'
                            : 'bg-slate-950 text-slate-300 border border-slate-700 hover:border-emerald-500/50 hover:text-white'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                            isEveryone
                              ? 'bg-slate-950 text-emerald-400 border-slate-950'
                              : 'border-slate-600'
                          }`}
                        >
                          {isEveryone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span>Everyone</span>
                      </button>

                      {/* Options 1 & 2: Individual and Multiple Checkable People Chips */}
                      {people.map((person) => {
                        const isSelected = assignedIds.includes(person.id);

                        return (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => onToggleAssignment(item.id, person.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-slate-100 text-slate-950 shadow-sm font-bold ring-1 ring-white/50'
                                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {/* Checkbox box */}
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                                isSelected
                                  ? 'bg-slate-950 text-white border-slate-950'
                                  : 'border-slate-600'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{person.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Food Shares Sidebar (strictly food, no taxes yet) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Food Shares Preview
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500">Raw items only</span>
              </div>

              {/* Per-Person Food Total Cards */}
              <div className="space-y-2">
                {people.map((p) => {
                  const sub = personSubtotals[p.id] || 0;
                  const pct = totalAssignedAmount > 0 ? (sub / totalAssignedAmount) * 100 : 0;

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium text-white">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: p.color || '#10b981' }}
                          />
                          <span>{p.name}</span>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono-nums">
                          {formatCurrency(sub, currency)}
                        </span>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tax Distribution Strategy Selector */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Tax / GST Split Rule
                  </label>
                  <span className="text-[10px] text-slate-500">Applied in Step 6</span>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 text-xs">
                    <input
                      type="radio"
                      name="taxSplitMethod"
                      value="proportional"
                      checked={taxSplitMethod === 'proportional'}
                      onChange={() => onChangeTaxSplitMethod('proportional')}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-white font-medium block">
                        Proportional to Food Consumed (Fairest)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Higher food share pays proportionally higher GST
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 text-xs">
                    <input
                      type="radio"
                      name="taxSplitMethod"
                      value="equal"
                      checked={taxSplitMethod === 'equal'}
                      onChange={() => onChangeTaxSplitMethod('equal')}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-white font-medium block">
                        Equal Split of Taxes
                      </span>
                      <span className="text-[10px] text-slate-500">
                        GST & charges divided equally among friends
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Calculate Split Primary CTA */}
              <button
                onClick={onCalculate}
                disabled={!allItemsAssigned || isCalculating}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg ${
                  allItemsAssigned
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.01] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                }`}
              >
                <span>{allItemsAssigned ? 'Calculate Split' : 'Assign All Items to Calculate'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
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
          onClick={onCalculate}
          disabled={!allItemsAssigned || isCalculating}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg ${
            allItemsAssigned
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
          }`}
        >
          <span>Calculate Split</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
