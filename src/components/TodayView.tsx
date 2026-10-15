import React, { useState, useEffect, useMemo } from 'react';
import { useFitness } from '../context/FitnessContext';
import { MealType } from '../types';
import { formatWeight, formatMacro, formatWorkoutWeight } from '../utils/unitConversion';
import {
  Camera,
  Plus,
  Dumbbell,
  Scale,
  ChevronRight,
  ChevronDown,
  Play,
  Clock,
  Flame,
  CheckCircle2,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface TodayViewProps {
  onOpenScanner: (mealType?: MealType) => void;
  onOpenFoodSearch: (mealType: MealType, tab?: 'ai' | 'search' | 'quick' | 'custom') => void;
  onStartWorkout: () => void;
  onOpenActiveWorkout?: () => void;
  onOpenWeightModal: () => void;
  onSwitchTab: (tab: 'train' | 'nutrition' | 'progress' | 'coach') => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  onOpenScanner,
  onOpenFoodSearch,
  onStartWorkout,
  onOpenActiveWorkout,
  onOpenWeightModal,
  onSwitchTab,
}) => {
  const {
    userProfile,
    selectedDate,
    todayRecord,
    workoutTemplates,
    startWorkout,
    activeWorkout,
    getNutritionalTotalsForDate,
    removeFoodItem,
    deleteWorkout,
    copyYesterdayMeals,
    unitSystem,
  } = useFitness();

  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Default to the first goal-matched routine in the dropdown
  const defaultTemplateId = useMemo(() => {
    const matched = workoutTemplates.find((t) =>
      t.recommendedGoals?.includes(userProfile.goal)
    );
    return matched?.id || workoutTemplates[0]?.id || 'custom';
  }, [workoutTemplates, userProfile.goal]);

  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(defaultTemplateId);
  const [showRoutinePreview, setShowRoutinePreview] = useState<boolean>(false);

  const selectedRoutine = useMemo(
    () => workoutTemplates.find((t) => t.id === selectedRoutineId),
    [workoutTemplates, selectedRoutineId]
  );

  const goalMatchedTemplates = useMemo(
    () => workoutTemplates.filter((t) => t.recommendedGoals?.includes(userProfile.goal)),
    [workoutTemplates, userProfile.goal]
  );

  const otherTemplates = useMemo(
    () => workoutTemplates.filter((t) => !t.recommendedGoals?.includes(userProfile.goal)),
    [workoutTemplates, userProfile.goal]
  );

  const handleQuickStartSelectedRoutine = () => {
    if (activeWorkout) {
      if (onOpenActiveWorkout) onOpenActiveWorkout();
      else onStartWorkout();
      return;
    }
    if (selectedRoutineId === 'custom') {
      startWorkout(undefined, 'Custom Training Session');
    } else {
      startWorkout(selectedRoutineId);
    }
    if (onOpenActiveWorkout) {
      onOpenActiveWorkout();
    } else {
      onStartWorkout();
    }
  };

  useEffect(() => {
    if (copyNotice) {
      const timer = setTimeout(() => setCopyNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [copyNotice]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const {
    consumedCalories,
    consumedProtein,
    consumedCarbs,
    consumedFat,
    burnedCalories,
    remainingCalories,
  } = getNutritionalTotalsForDate(selectedDate);

  const targetCalories = userProfile.targetCalories || 2200;
  const caloriePercent = Math.min(100, Math.round((consumedCalories / targetCalories) * 100));

  const proteinTarget = userProfile.targetProtein || 160;
  const carbsTarget = userProfile.targetCarbs || 230;
  const fatTarget = userProfile.targetFat || 70;

  const proteinPercent = Math.min(100, Math.round((consumedProtein / proteinTarget) * 100));
  const carbsPercent = Math.min(100, Math.round((consumedCarbs / carbsTarget) * 100));
  const fatPercent = Math.min(100, Math.round((consumedFat / fatTarget) * 100));

  const totalFoodItemsCount =
    todayRecord.meals.breakfast.length +
    todayRecord.meals.lunch.length +
    todayRecord.meals.dinner.length +
    todayRecord.meals.snacks.length;

  const mealsList: Array<{ type: MealType; label: string }> = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'dinner', label: 'Dinner' },
    { type: 'snacks', label: 'Snacks' },
  ];

  const getMealCalories = (type: MealType) => {
    return todayRecord.meals[type].reduce((sum, item) => {
      const mult = item.servingMultiplier || 1;
      return sum + Math.round(item.calories * mult);
    }, 0);
  };

  const getMealMacros = (type: MealType) => {
    return todayRecord.meals[type].reduce(
      (acc, item) => {
        const mult = item.servingMultiplier || 1;
        return {
          protein: acc.protein + Math.round(item.protein * mult),
          carbs: acc.carbs + Math.round(item.carbs * mult),
          fat: acc.fat + Math.round(item.fat * mult),
        };
      },
      { protein: 0, carbs: 0, fat: 0 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Greeting & Primary Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {getGreeting()}, {userProfile.nickname || userProfile.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            Weight: {formatWeight(userProfile.currentWeightKg, unitSystem)} · BMI {userProfile.bmi || 24.1} ({userProfile.bmiCategory || 'Normal'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenScanner('lunch')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Meal</span>
          </button>

          <button
            onClick={() => onOpenFoodSearch('lunch', 'ai')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Log Food</span>
          </button>

          <button
            onClick={onStartWorkout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
          >
            <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
            <span>Workout</span>
          </button>

          <button
            onClick={onOpenWeightModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-sky-400" />
            <span>Weigh-In</span>
          </button>
        </div>
      </div>

      {/* Unified Energy & Macronutrient Overview Card (Single-Elevation, Zero Nested Boxes) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800/90">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 7 Cols: Calorie Ring & Inline Energy Ledger */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-neutral-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-emerald-500 transition-all duration-700 ease-out"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(1, consumedCalories / targetCalories))}`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black tracking-tight text-white font-mono tabular-nums">
                  {remainingCalories > 0 ? remainingCalories : 0}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400">
                  {remainingCalories >= 0 ? 'kcal left' : 'kcal over'}
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4 text-center sm:text-left">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Daily Energy Balance</h2>
                <p className="text-xs text-neutral-400">{caloriePercent}% of daily calorie target consumed</p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-neutral-800 pt-1">
                <div className="pr-3">
                  <div className="text-[11px] text-neutral-400">Daily Target</div>
                  <div className="text-base font-bold text-white font-mono tabular-nums mt-0.5">
                    {targetCalories}
                  </div>
                </div>
                <div className="px-3">
                  <div className="text-[11px] text-neutral-400">Food Logged</div>
                  <div className="text-base font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                    {consumedCalories}
                  </div>
                </div>
                <div className="pl-3">
                  <div className="text-[11px] text-neutral-400">Burned</div>
                  <div className="text-base font-bold text-amber-400 font-mono tabular-nums mt-0.5">
                    +{burnedCalories}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Clean Macronutrient Bars */}
          <div className="lg:col-span-5 lg:border-l lg:border-neutral-800 lg:pl-6 space-y-3.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
            {/* Protein */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-200">Protein</span>
                <span className="text-neutral-400 font-mono tabular-nums">
                  <strong className="text-sky-400">{formatMacro(consumedProtein, unitSystem)}</strong> / {formatMacro(proteinTarget, unitSystem)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-200">Carbohydrates</span>
                <span className="text-neutral-400 font-mono tabular-nums">
                  <strong className="text-amber-400">{formatMacro(consumedCarbs, unitSystem)}</strong> / {formatMacro(carbsTarget, unitSystem)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-200">Dietary Fat</span>
                <span className="text-neutral-400 font-mono tabular-nums">
                  <strong className="text-rose-400">{formatMacro(consumedFat, unitSystem)}</strong> / {formatMacro(fatTarget, unitSystem)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Meals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white tracking-tight">Meals</h2>
            {totalFoodItemsCount === 0 && (
              <button
                onClick={() => {
                  const copied = copyYesterdayMeals();
                  setCopyNotice(
                    copied ? 'Copied yesterday’s meals' : 'No meals logged yesterday'
                  );
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Copy yesterday</span>
              </button>
            )}
            {copyNotice && (
              <span className="text-xs text-amber-400">{copyNotice}</span>
            )}
          </div>

          <button
            onClick={() => onSwitchTab('nutrition')}
            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Nutrition details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mealsList.map((meal) => {
            const items = todayRecord.meals[meal.type];
            const mealCals = getMealCalories(meal.type);
            const macros = getMealMacros(meal.type);

            return (
              <div
                key={meal.type}
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800/80 flex flex-col justify-between"
              >
                <div>
                  {/* Clean Single-Row Meal Header with Inline Actions */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800/70">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{meal.label}</h3>
                        <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
                          {mealCals} kcal
                        </span>
                      </div>
                      {items.length > 0 && (
                        <div className="text-[11px] text-neutral-400 font-mono tabular-nums mt-0.5">
                          P {formatMacro(macros.protein, unitSystem)} · C {formatMacro(macros.carbs, unitSystem)} · F {formatMacro(macros.fat, unitSystem)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenScanner(meal.type)}
                        className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors"
                        title={`Scan ${meal.label}`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenFoodSearch(meal.type)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Logged Items List */}
                  {items.length > 0 ? (
                    <div className="divide-y divide-neutral-800/50 pt-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs py-2 group/item"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="text-neutral-200 font-medium truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate">
                              {item.servingDescription}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-neutral-300 font-mono tabular-nums">
                              {Math.round(item.calories * (item.servingMultiplier || 1))} kcal
                            </span>
                            <button
                              onClick={() => removeFoodItem(meal.type, item.id)}
                              className="opacity-60 sm:opacity-0 sm:group-hover/item:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-3 text-xs text-neutral-500">
                      No items logged
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Training Section (Dropdown Routine Selector) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Training</h2>
                <span className="text-xs font-mono tabular-nums text-neutral-400">
                  {todayRecord.workouts.length > 0
                    ? `${todayRecord.workouts.length} logged`
                    : '0 logged'}
                </span>
              </div>
              {selectedRoutine && !activeWorkout && (
                <p className="text-xs text-neutral-400 mt-0.5 font-mono tabular-nums">
                  {selectedRoutine.category} · ~{selectedRoutine.estimatedMinutes}m · ~{selectedRoutine.estimatedCalories} kcal · {selectedRoutine.exercises.length} exercises
                </p>
              )}
              {activeWorkout && (
                <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                  Active session: {activeWorkout.name}
                </p>
              )}
            </div>

            <button
              onClick={() => onSwitchTab('train')}
              className="sm:hidden text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-0.5"
            >
              <span>Train hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dropdown Selection & Start Control */}
          <div className="flex items-center gap-2">
            {!activeWorkout && (
              <>
                <select
                  value={selectedRoutineId}
                  onChange={(e) => setSelectedRoutineId(e.target.value)}
                  aria-label="Select workout routine"
                  className="flex-1 sm:w-64 py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-medium text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  {goalMatchedTemplates.length > 0 && (
                    <optgroup label="Recommended for Your Goal">
                      {goalMatchedTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          ★ {t.name} (~{t.estimatedMinutes}m)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Workout Routines">
                    {otherTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (~{t.estimatedMinutes}m)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Freestyle">
                    <option value="custom">+ Blank / Custom Session</option>
                  </optgroup>
                </select>

                {selectedRoutine && (
                  <button
                    type="button"
                    onClick={() => setShowRoutinePreview(!showRoutinePreview)}
                    className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                    title={showRoutinePreview ? 'Hide routine preview' : 'Preview routine exercises'}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showRoutinePreview ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>
                )}
              </>
            )}

            <button
              onClick={handleQuickStartSelectedRoutine}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shrink-0 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{activeWorkout ? 'Resume' : 'Start'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Routine Exercise Preview */}
        {showRoutinePreview && selectedRoutine && !activeWorkout && (
          <div className="pt-2.5 border-t border-neutral-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>{selectedRoutine.description}</span>
              <button
                onClick={() => onSwitchTab('train')}
                className="text-emerald-400 hover:text-emerald-300 font-medium shrink-0 ml-2"
              >
                Open Exercise Library →
              </button>
            </div>
            <div className="divide-y divide-neutral-800/50">
              {selectedRoutine.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="py-1.5 flex items-center justify-between text-xs text-neutral-300"
                >
                  <span>
                    {ex.name} <span className="text-neutral-500">({ex.targetMuscle})</span>
                  </span>
                  <span className="font-mono tabular-nums text-neutral-400">
                    {ex.defaultSets} × {ex.defaultReps}
                    {ex.defaultWeightKg > 0
                      ? ` @ ${formatWorkoutWeight(ex.defaultWeightKg, unitSystem)}`
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Sessions Today */}
        {todayRecord.workouts.length > 0 && (
          <div className="divide-y divide-neutral-800/60 pt-2 border-t border-neutral-800/70">
            {todayRecord.workouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between py-2.5 first:pt-1 last:pb-0"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{workout.name}</div>
                  <div className="text-xs text-neutral-400 font-mono tabular-nums mt-0.5">
                    {workout.category || 'Strength'} · {workout.durationMinutes}m · {workout.exercises.length} exercises ·{' '}
                    <span className="text-amber-400">-{workout.caloriesBurned} kcal</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                    title="Remove Workout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
