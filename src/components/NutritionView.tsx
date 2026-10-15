import React, { useState, useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import { MealType } from '../types';
import { formatMacro, formatLiquidVolume } from '../utils/unitConversion';
import {
  Camera,
  Plus,
  Trash2,
  Droplets,
  Edit2,
  Check,
  Search,
} from 'lucide-react';

interface NutritionViewProps {
  onOpenScanner: (mealType?: MealType) => void;
  onOpenFoodSearch: (mealType: MealType, tab?: 'ai' | 'search' | 'quick' | 'custom') => void;
  onGoHome?: () => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  onOpenScanner,
  onOpenFoodSearch,
}) => {
  const {
    userProfile,
    selectedDate,
    todayRecord,
    getNutritionalTotalsForDate,
    removeFoodItem,
    updateFoodItem,
    unitSystem,
  } = useFitness();

  const {
    consumedCalories,
    consumedProtein,
    consumedCarbs,
    consumedFat,
    remainingCalories,
  } = getNutritionalTotalsForDate(selectedDate);

  const [waterByDate, setWaterByDate] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('myfitness_water_logs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('myfitness_water_logs', JSON.stringify(waterByDate));
    } catch {
      // ignore storage errors
    }
  }, [waterByDate]);

  const waterGlasses = waterByDate[selectedDate] ?? 6;
  const setWaterGlassesForDate = (updater: (prev: number) => number) => {
    setWaterByDate((prev) => ({
      ...prev,
      [selectedDate]: updater(prev[selectedDate] ?? 6),
    }));
  };

  const [editingItem, setEditingItem] = useState<{ meal: MealType; id: string; mult: number } | null>(null);

  const mealsList: Array<{ type: MealType; label: string }> = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'dinner', label: 'Dinner' },
    { type: 'snacks', label: 'Snacks' },
  ];

  const getMealStats = (type: MealType) => {
    return todayRecord.meals[type].reduce(
      (acc, item) => {
        const mult = item.servingMultiplier || 1;
        return {
          calories: acc.calories + Math.round(item.calories * mult),
          protein: acc.protein + Math.round(item.protein * mult),
          carbs: acc.carbs + Math.round(item.carbs * mult),
          fat: acc.fat + Math.round(item.fat * mult),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const totalCals = consumedCalories || 1;
  const proteinCals = consumedProtein * 4;
  const carbsCals = consumedCarbs * 4;
  const fatCals = consumedFat * 9;

  const proteinPct = Math.round((proteinCals / totalCals) * 100);
  const carbsPct = Math.round((carbsCals / totalCals) * 100);
  const fatPct = Math.round((fatCals / totalCals) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Nutrition & Hydration</h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono tabular-nums">
            {consumedCalories} / {userProfile.targetCalories} kcal ·{' '}
            {remainingCalories >= 0
              ? `${remainingCalories} kcal remaining`
              : `${Math.abs(remainingCalories)} kcal over`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenFoodSearch('lunch', 'search')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span>Search Food</span>
          </button>
          <button
            onClick={() => onOpenScanner('lunch')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Meal</span>
          </button>
        </div>
      </div>

      {/* Top Overview Grid: Macro Split (2 cols) + Hydration (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Macro Split Card */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-neutral-900 border border-neutral-800/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Macronutrient Split</span>
            <span className="font-mono tabular-nums text-neutral-400">
              P {proteinPct}% · C {carbsPct}% · F {fatPct}%
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-neutral-950 flex overflow-hidden">
            <div
              style={{ width: `${Math.max(5, proteinPct)}%` }}
              className="bg-sky-400 h-full transition-all"
              title={`Protein: ${proteinPct}%`}
            />
            <div
              style={{ width: `${Math.max(5, carbsPct)}%` }}
              className="bg-amber-400 h-full transition-all"
              title={`Carbs: ${carbsPct}%`}
            />
            <div
              style={{ width: `${Math.max(5, fatPct)}%` }}
              className="bg-rose-400 h-full transition-all"
              title={`Fat: ${fatPct}%`}
            />
          </div>

          <div className="grid grid-cols-3 divide-x divide-neutral-800 text-xs pt-1">
            <div className="pr-3">
              <div className="text-neutral-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Protein</span>
              </div>
              <div className="font-mono tabular-nums text-white font-bold mt-0.5">
                {formatMacro(consumedProtein, unitSystem)}{' '}
                <span className="text-neutral-500 font-normal">/ {formatMacro(userProfile.targetProtein, unitSystem)}</span>
              </div>
            </div>

            <div className="px-3">
              <div className="text-neutral-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Carbs</span>
              </div>
              <div className="font-mono tabular-nums text-white font-bold mt-0.5">
                {formatMacro(consumedCarbs, unitSystem)}{' '}
                <span className="text-neutral-500 font-normal">/ {formatMacro(userProfile.targetCarbs, unitSystem)}</span>
              </div>
            </div>

            <div className="pl-3">
              <div className="text-neutral-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Fat</span>
              </div>
              <div className="font-mono tabular-nums text-white font-bold mt-0.5">
                {formatMacro(consumedFat, unitSystem)}{' '}
                <span className="text-neutral-500 font-normal">/ {formatMacro(userProfile.targetFat, unitSystem)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hydration Card */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white">Hydration</span>
            </div>
            <span className="text-xs font-mono tabular-nums text-sky-400 font-semibold">
              {formatLiquidVolume(waterGlasses * 250, unitSystem)} / {formatLiquidVolume(2500, unitSystem)}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (waterGlasses / 10) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs text-neutral-400 font-mono tabular-nums">
              {waterGlasses} / 10 glasses
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWaterGlassesForDate((prev) => Math.max(0, prev - 1))}
                className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 font-bold hover:bg-neutral-700 flex items-center justify-center text-xs"
              >
                -
              </button>
              <button
                onClick={() => setWaterGlassesForDate((prev) => prev + 1)}
                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-colors"
              >
                +{formatLiquidVolume(250, unitSystem)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meals Breakdown (Single-Elevation Cards with Hairline Dividers) */}
      <div className="space-y-3">
        {mealsList.map((meal) => {
          const items = todayRecord.meals[meal.type];
          const stats = getMealStats(meal.type);

          return (
            <div
              key={meal.type}
              className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800/80"
            >
              {/* Meal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold text-white">{meal.label}</h2>
                    <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
                      {stats.calories} kcal
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono tabular-nums mt-0.5">
                    P {formatMacro(stats.protein, unitSystem)} · C {formatMacro(stats.carbs, unitSystem)} · F {formatMacro(stats.fat, unitSystem)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenScanner(meal.type)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-emerald-400 transition-colors"
                    title="Scan Meal"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenFoodSearch(meal.type, 'ai')}
                    className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Log Food</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 ? (
                <div className="divide-y divide-neutral-800/60 pt-1">
                  {items.map((item) => {
                    const mult = item.servingMultiplier || 1;
                    const isEditing =
                      editingItem?.meal === meal.type && editingItem?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        className="py-3 first:pt-2.5 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                          <div className="text-[11px] text-neutral-400">
                            {item.servingDescription} {mult !== 1 ? `· ${mult}x` : ''}
                          </div>
                          {item.ingredients && item.ingredients.length > 0 && (
                            <div className="text-[11px] text-neutral-500 truncate max-w-md mt-0.5">
                              {item.ingredients.map((ing) => ing.name).join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-left sm:text-right font-mono tabular-nums">
                            <div className="text-xs font-bold text-white">
                              {Math.round(item.calories * mult)} kcal
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              {Math.round(item.protein * mult)}P · {Math.round(item.carbs * mult)}C · {Math.round(item.fat * mult)}F
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-700 rounded-lg p-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  max="10"
                                  value={editingItem.mult}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      mult: parseFloat(e.target.value) || 1,
                                    })
                                  }
                                  className="w-12 bg-transparent text-white text-xs px-1 py-0.5 font-mono"
                                />
                                <button
                                  onClick={() => {
                                    updateFoodItem(meal.type, item.id, {
                                      servingMultiplier: editingItem.mult,
                                    });
                                    setEditingItem(null);
                                  }}
                                  className="p-1 text-emerald-400 hover:bg-neutral-800 rounded"
                                  title="Save portion"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setEditingItem({ meal: meal.type, id: item.id, mult })
                                }
                                className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                                title="Edit portion"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => removeFoodItem(meal.type, item.id)}
                              className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-3 text-xs text-neutral-500">
                  No items logged
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
