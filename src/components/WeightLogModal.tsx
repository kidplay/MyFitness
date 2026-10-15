import React, { useState, useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import { getTodayDateString } from '../data/initialData';
import { UnitSystem } from '../types';
import { kgToLbs, lbsToKg } from '../utils/unitConversion';
import { X, Scale, Check, Home } from 'lucide-react';

interface WeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeightLogModal: React.FC<WeightLogModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, logWeight, selectedDate, unitSystem } = useFitness();

  const [activeUnit, setActiveUnit] = useState<UnitSystem>(unitSystem || 'metric');
  const [weight, setWeight] = useState<string>('');
  const [date, setDate] = useState<string>(selectedDate || getTodayDateString(0));
  const [note, setNote] = useState<string>('Morning weigh-in');

  useEffect(() => {
    if (isOpen) {
      setActiveUnit(unitSystem);
      setWeight(
        unitSystem === 'imperial'
          ? kgToLbs(userProfile.currentWeightKg, 1).toString()
          : userProfile.currentWeightKg.toString()
      );
      setDate(selectedDate || getTodayDateString(0));
    }
  }, [isOpen, unitSystem, userProfile.currentWeightKg, selectedDate]);

  if (!isOpen) return null;

  const handleUnitToggle = (newUnit: UnitSystem) => {
    if (newUnit === activeUnit) return;
    const currentVal = parseFloat(weight);
    if (!isNaN(currentVal) && currentVal > 0) {
      if (newUnit === 'imperial') {
        // kg to lbs
        setWeight(kgToLbs(currentVal, 1).toString());
      } else {
        // lbs to kg
        setWeight(lbsToKg(currentVal, 1).toString());
      }
    }
    setActiveUnit(newUnit);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || isNaN(w)) return;

    // Convert to kg if entered in lbs
    const finalKg = activeUnit === 'imperial' ? lbsToKg(w, 2) : Number(w.toFixed(1));
    logWeight(finalKg, date, note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Log Body Weight</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700 transition-colors"
              title="Cancel and return to Today's screen"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span>Home</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Unit Toggle Pill */}
          <div className="flex items-center justify-between text-xs">
            <label className="text-xs font-semibold text-neutral-300">
              Weight ({activeUnit === 'imperial' ? 'lbs' : 'kg'}) *
            </label>
            <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => handleUnitToggle('metric')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  activeUnit === 'metric'
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                kg
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('imperial')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  activeUnit === 'imperial'
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                lbs
              </button>
            </div>
          </div>

          <div>
            <input
              type="number"
              step="0.1"
              required
              min={activeUnit === 'imperial' ? '60' : '30'}
              max={activeUnit === 'imperial' ? '660' : '300'}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-lg font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Morning fasted, post-workout"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-neutral-400" />
              <span>Cancel (Home)</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Weight</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
