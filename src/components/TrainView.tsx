import React, { useState, useMemo, useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import {
  WorkoutTemplate,
  ExerciseLibraryItem,
  ExerciseMuscleGroup,
  ExerciseEquipment,
  FitnessGoal,
} from '../types';
import { EXERCISE_LIBRARY } from '../data/initialData';
import { formatWorkoutWeight } from '../utils/unitConversion';
import {
  Dumbbell,
  Play,
  Plus,
  Clock,
  Flame,
  CheckCircle2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface TrainViewProps {
  onOpenActiveWorkout: () => void;
  onGoHome?: () => void;
}

const GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_weight: 'Aggressive Fat Loss',
  mild_fat_loss: 'Sustainable Fat Loss',
  maintain: 'Body Recomposition',
  lean_bulk: 'Lean Muscle Gain',
  aggressive_bulk: 'Hypertrophy & Mass',
  strength_power: 'Peak Strength & Power',
  endurance: 'Endurance & Stamina',
};

const MUSCLE_GROUPS: Array<'All' | ExerciseMuscleGroup> = [
  'All',
  'Chest',
  'Triceps',
  'Back',
  'Biceps',
  'Shoulders',
  'Legs & Glutes',
  'Core & Abs',
  'Full Body & HIIT',
  'Cardio & Endurance',
];

const EQUIPMENT_FILTERS: Array<'All' | ExerciseEquipment> = [
  'All',
  'Dumbbell',
  'Barbell / EZ-Bar',
  'Cable / Machine',
  'Bodyweight',
  'Kettlebell / Specialty',
  'Cardio',
];

export const TrainView: React.FC<TrainViewProps> = ({ onOpenActiveWorkout }) => {
  const {
    workoutTemplates,
    startWorkout,
    addActiveWorkoutExercise,
    activeWorkout,
    dayRecords,
    deleteWorkout,
    userProfile,
    unitSystem,
  } = useFitness();

  // Main sub-navigation: Routines vs Exercise Library
  const [activeSubTab, setActiveSubTab] = useState<'routines' | 'library'>('routines');

  // Routine filters & dropdown selection
  const [selectedRoutineCategory, setSelectedRoutineCategory] = useState<string>('All');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(() => {
    const matched = workoutTemplates.find((t) =>
      t.recommendedGoals?.includes(userProfile.goal)
    );
    return matched?.id || workoutTemplates[0]?.id || '';
  });
  const [customWorkoutName, setCustomWorkoutName] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  // Exercise Library filters & dropdown selection
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<'All' | ExerciseMuscleGroup>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<'All' | ExerciseEquipment>('All');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<'all' | 'my_goal' | FitnessGoal>('all');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISE_LIBRARY[0]?.id || '');
  const [showAllExercisesList, setShowAllExercisesList] = useState<boolean>(false);

  // Custom Session Builder
  const [selectedBuilderIds, setSelectedBuilderIds] = useState<string[]>([]);
  const [builderSessionName, setBuilderSessionName] = useState<string>('');
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  const routineCategories = [
    'All',
    'Recommended for Goal',
    'Hypertrophy',
    'Power & Strength',
    'HIIT & Fat Loss',
    'Cardio & Endurance',
    'Bodyweight & Core',
  ];

  const filteredTemplates = useMemo(() => {
    return workoutTemplates.filter((t) => {
      if (selectedRoutineCategory === 'All') return true;
      if (selectedRoutineCategory === 'Recommended for Goal') {
        return t.recommendedGoals?.includes(userProfile.goal);
      }
      return t.category.toLowerCase() === selectedRoutineCategory.toLowerCase();
    });
  }, [workoutTemplates, selectedRoutineCategory, userProfile.goal]);

  // Keep selectedRoutineId in sync when category filter changes
  useEffect(() => {
    if (
      filteredTemplates.length > 0 &&
      !filteredTemplates.some((t) => t.id === selectedRoutineId)
    ) {
      setSelectedRoutineId(filteredTemplates[0].id);
    }
  }, [filteredTemplates, selectedRoutineId]);

  const selectedTemplate = useMemo(
    () =>
      filteredTemplates.find((t) => t.id === selectedRoutineId) ||
      filteredTemplates[0] ||
      workoutTemplates[0],
    [filteredTemplates, selectedRoutineId, workoutTemplates]
  );

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchesMuscle =
        selectedMuscleGroup === 'All' || ex.muscleGroup === selectedMuscleGroup;
      const matchesEquipment =
        selectedEquipment === 'All' || ex.equipment === selectedEquipment;

      let matchesGoal = true;
      if (selectedGoalFilter === 'my_goal') {
        matchesGoal = ex.recommendedGoals.includes(userProfile.goal);
      } else if (selectedGoalFilter !== 'all') {
        matchesGoal = ex.recommendedGoals.includes(selectedGoalFilter);
      }

      if (!matchesMuscle || !matchesEquipment || !matchesGoal) return false;
      if (!q) return true;

      const nameMatch = ex.name.toLowerCase().includes(q);
      const muscleMatch =
        ex.targetMuscle.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q);
      const equipMatch = ex.equipment.toLowerCase().includes(q);
      const aliasMatch = ex.aliases?.some((a) => a.toLowerCase().includes(q)) || false;
      const cueMatch = ex.formCue.toLowerCase().includes(q);

      return nameMatch || muscleMatch || equipMatch || aliasMatch || cueMatch;
    });
  }, [exerciseSearch, selectedMuscleGroup, selectedEquipment, selectedGoalFilter, userProfile.goal]);

  // Keep selectedExerciseId in sync with filteredExercises
  useEffect(() => {
    if (
      filteredExercises.length > 0 &&
      !filteredExercises.some((ex) => ex.id === selectedExerciseId)
    ) {
      setSelectedExerciseId(filteredExercises[0].id);
    }
  }, [filteredExercises, selectedExerciseId]);

  const activeExercise = useMemo(
    () =>
      filteredExercises.find((ex) => ex.id === selectedExerciseId) ||
      filteredExercises[0] ||
      null,
    [filteredExercises, selectedExerciseId]
  );

  // Group filtered exercises by muscle group for the <select> dropdown
  const groupedFilteredExercises = useMemo(() => {
    const map = new Map<string, ExerciseLibraryItem[]>();
    filteredExercises.forEach((ex) => {
      const list = map.get(ex.muscleGroup) || [];
      list.push(ex);
      map.set(ex.muscleGroup, list);
    });
    return Array.from(map.entries());
  }, [filteredExercises]);

  const selectedBuilderExercises = useMemo(() => {
    return selectedBuilderIds
      .map((id) => EXERCISE_LIBRARY.find((ex) => ex.id === id))
      .filter((ex): ex is ExerciseLibraryItem => Boolean(ex));
  }, [selectedBuilderIds]);

  const handleToggleBuilderExercise = (exerciseId: string) => {
    setSelectedBuilderIds((prev) =>
      prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId]
    );
  };

  const handleStartBuiltWorkout = () => {
    if (selectedBuilderExercises.length === 0) return;
    const defaultTitle =
      builderSessionName.trim() ||
      (selectedMuscleGroup !== 'All'
        ? `${selectedMuscleGroup} Custom Session`
        : `Custom ${GOAL_LABELS[userProfile.goal]} Session`);

    startWorkout(
      undefined,
      defaultTitle,
      selectedBuilderExercises.map((ex) => ({
        name: ex.name,
        targetMuscle: ex.targetMuscle,
        defaultSets: ex.defaultSets,
        defaultReps: ex.defaultReps,
        defaultWeightKg: ex.defaultWeightKg,
        category: ex.category,
      }))
    );
    setSelectedBuilderIds([]);
    setBuilderSessionName('');
    onOpenActiveWorkout();
  };

  const handleQuickAddOrStartExercise = (ex: ExerciseLibraryItem) => {
    if (activeWorkout) {
      addActiveWorkoutExercise(
        ex.name,
        ex.targetMuscle,
        ex.category,
        ex.defaultWeightKg,
        ex.defaultReps
      );
      setAddedFeedbackId(ex.id);
      setTimeout(() => {
        setAddedFeedbackId((prev) => (prev === ex.id ? null : prev));
      }, 1600);
    } else {
      startWorkout(undefined, `${ex.muscleGroup} Training Session`, [
        {
          name: ex.name,
          targetMuscle: ex.targetMuscle,
          defaultSets: ex.defaultSets,
          defaultReps: ex.defaultReps,
          defaultWeightKg: ex.defaultWeightKg,
          category: ex.category,
        },
      ]);
      onOpenActiveWorkout();
    }
  };

  const handleStartTemplate = (template: WorkoutTemplate) => {
    startWorkout(template.id);
    onOpenActiveWorkout();
  };

  const handleStartCustom = (e: React.FormEvent) => {
    e.preventDefault();
    startWorkout(undefined, customWorkoutName.trim() || 'Custom Training');
    setShowCustomModal(false);
    setCustomWorkoutName('');
    onOpenActiveWorkout();
  };

  // Compile all past workouts across day records
  const allPastWorkouts = Object.entries(dayRecords)
    .flatMap(([dateStr, record]) =>
      record.workouts.map((w) => ({
        ...w,
        recordedDate: dateStr,
      }))
    )
    .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate));

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Active Workout Banner if currently in progress */}
      {activeWorkout && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-neutral-900 border border-emerald-500/40 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-white">Active Workout in Progress</h3>
            </div>
            <p className="text-xs text-neutral-300">
              {activeWorkout.name} · {activeWorkout.exercises.length} exercises
            </p>
          </div>

          <button
            onClick={onOpenActiveWorkout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all"
          >
            <span>Resume Session</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary View Switcher: Workout Routines vs Exercise Library */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Training Hub</h2>
          <p className="text-xs text-neutral-400">
            Select a guided routine or pick exercises from the library
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('routines')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'routines'
                ? 'bg-emerald-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Routines ({workoutTemplates.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'library'
                ? 'bg-emerald-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Exercises ({EXERCISE_LIBRARY.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: WORKOUT ROUTINES (DROPDOWN SELECTION CARD) ================= */}
      {activeSubTab === 'routines' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800/90 space-y-5">
          {/* Dropdown Selection Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-4 border-b border-neutral-800/80 items-end">
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 block">
                Filter by Category
              </label>
              <select
                value={selectedRoutineCategory}
                onChange={(e) => setSelectedRoutineCategory(e.target.value)}
                aria-label="Filter routines by category"
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-medium text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                {routineCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All'
                      ? 'All Categories'
                      : cat === 'Recommended for Goal'
                      ? `★ For My Goal (${GOAL_LABELS[userProfile.goal]})`
                      : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 block">
                Select Workout Routine ({filteredTemplates.length})
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => setSelectedRoutineId(e.target.value)}
                aria-label="Select workout routine"
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              >
                {filteredTemplates.map((t) => {
                  const isGoalMatched = t.recommendedGoals?.includes(userProfile.goal);
                  return (
                    <option key={t.id} value={t.id}>
                      {isGoalMatched ? '★ ' : ''}
                      {t.name} (~{t.estimatedMinutes}m · ~{t.estimatedCalories} kcal)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="sm:col-span-3 flex items-center gap-2">
              {selectedTemplate && (
                <button
                  onClick={() => handleStartTemplate(selectedTemplate)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </button>
              )}

              <button
                onClick={() => setShowCustomModal(true)}
                className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
                title="Start a blank custom session"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Blank</span>
              </button>
            </div>
          </div>

          {/* Selected Routine Focused Details */}
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mb-1">
                    <span className="font-semibold text-emerald-400">
                      {selectedTemplate.category}
                    </span>
                    {selectedTemplate.focusArea && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{selectedTemplate.focusArea}</span>
                      </>
                    )}
                    {selectedTemplate.recommendedGoals?.includes(userProfile.goal) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400 font-medium">Recommended for Goal</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedTemplate.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    {selectedTemplate.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-neutral-300 shrink-0 pt-1 sm:pt-0">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    ~{selectedTemplate.estimatedMinutes} mins
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    ~{selectedTemplate.estimatedCalories} kcal
                  </span>
                </div>
              </div>

              {/* Exercises Breakdown in Single Hairline-Divided List */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-neutral-300">
                  Included Exercises ({selectedTemplate.exercises.length})
                </div>
                <div className="divide-y divide-neutral-800/70 border-y border-neutral-800/80">
                  {selectedTemplate.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-white">{ex.name}</span>
                        <span className="text-neutral-400 ml-2">{ex.targetMuscle}</span>
                      </div>
                      <span className="font-mono tabular-nums text-neutral-300 shrink-0">
                        {ex.defaultSets} × {ex.defaultReps}
                        {ex.defaultWeightKg > 0
                          ? ` @ ${formatWorkoutWeight(ex.defaultWeightKg, unitSystem)}`
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: EXERCISE LIBRARY & BUILDER (DROPDOWN SELECTION) ================= */}
      {activeSubTab === 'library' && (
        <div className="space-y-4">
          {/* Custom Builder Bar when exercises are selected */}
          {selectedBuilderExercises.length > 0 && (
            <div className="p-4 rounded-2xl bg-neutral-900 border border-emerald-500/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-emerald-400">
                    Custom Session Builder ({selectedBuilderExercises.length} selected)
                  </div>
                  <div className="text-xs text-neutral-300">
                    {selectedBuilderExercises.map((e) => e.name).join(' · ')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={builderSessionName}
                    onChange={(e) => setBuilderSessionName(e.target.value)}
                    placeholder="Session name..."
                    className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => setSelectedBuilderIds([])}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleStartBuiltWorkout}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start ({selectedBuilderExercises.length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unified Exercise Selector Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800/90 space-y-5">
            {/* Filter Row: Search + Muscle Dropdown + Equipment Dropdown + Goal Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
              <div className="relative lg:col-span-4">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Search Flyes, Tricep Press, Skull Crushers..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
                {exerciseSearch && (
                  <button
                    onClick={() => setExerciseSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="lg:col-span-3">
                <select
                  value={selectedMuscleGroup}
                  onChange={(e) => setSelectedMuscleGroup(e.target.value as any)}
                  aria-label="Filter by muscle group"
                  className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group === 'All' ? 'All Muscle Groups' : group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value as any)}
                  aria-label="Filter by equipment"
                  className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  {EQUIPMENT_FILTERS.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq === 'All' ? 'All Equipment' : eq}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <select
                  value={selectedGoalFilter}
                  onChange={(e) => setSelectedGoalFilter(e.target.value as any)}
                  aria-label="Filter by fitness goal"
                  className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Fitness Goals</option>
                  <option value="my_goal">My Goal ({GOAL_LABELS[userProfile.goal]})</option>
                  <option value="lean_bulk">Hypertrophy & Bulk</option>
                  <option value="strength_power">Strength & Power</option>
                  <option value="lose_weight">Fat Loss & HIIT</option>
                  <option value="endurance">Endurance & Stamina</option>
                </select>
              </div>
            </div>

            {filteredExercises.length === 0 ? (
              <div className="py-6 text-center space-y-2 border-t border-neutral-800/80">
                <p className="text-sm font-semibold text-white">No matching exercises found</p>
                <button
                  onClick={() => {
                    setExerciseSearch('');
                    setSelectedMuscleGroup('All');
                    setSelectedEquipment('All');
                    setSelectedGoalFilter('all');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                {/* Exercise Dropdown Selector */}
                <div className="pt-3 border-t border-neutral-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-neutral-400">
                      Select Exercise ({filteredExercises.length} available)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAllExercisesList(!showAllExercisesList)}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <span>
                        {showAllExercisesList
                          ? 'Hide full exercise list'
                          : `Browse all ${filteredExercises.length} as list`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          showAllExercisesList ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <select
                    value={activeExercise?.id || ''}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    aria-label="Select an exercise"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  >
                    {groupedFilteredExercises.map(([muscleGroup, groupItems]) => (
                      <optgroup key={muscleGroup} label={muscleGroup}>
                        {groupItems.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name} · {ex.equipment} ({ex.defaultSets} × {ex.defaultReps})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Selected Exercise Focused View */}
                {activeExercise && (
                  <div className="pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                        <span className="font-semibold text-emerald-400">
                          {activeExercise.muscleGroup}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{activeExercise.equipment}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-neutral-300">
                          {activeExercise.defaultSets} × {activeExercise.defaultReps}
                          {activeExercise.defaultWeightKg > 0
                            ? ` @ ${formatWorkoutWeight(activeExercise.defaultWeightKg, unitSystem)}`
                            : ''}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white">{activeExercise.name}</h4>

                      <p className="text-xs text-neutral-400">
                        Target: <span className="text-neutral-300">{activeExercise.targetMuscle}</span>
                      </p>

                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {activeExercise.formCue}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-stretch gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBuilderExercise(activeExercise.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          selectedBuilderIds.includes(activeExercise.id)
                            ? 'bg-emerald-500 text-neutral-950 font-bold'
                            : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-200 border border-neutral-800'
                        }`}
                      >
                        {selectedBuilderIds.includes(activeExercise.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Add to Builder</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAddOrStartExercise(activeExercise)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 text-white text-xs font-bold transition-colors"
                      >
                        {addedFeedbackId === activeExercise.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Added!</span>
                          </>
                        ) : activeWorkout ? (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Active</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Quick Start</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Optional Collapsible Compact Exercise List */}
                {showAllExercisesList && (
                  <div className="pt-3 border-t border-neutral-800/80 divide-y divide-neutral-800/60 max-h-80 overflow-y-auto pr-1">
                    {filteredExercises.map((ex) => {
                      const isSelected = selectedBuilderIds.includes(ex.id);
                      return (
                        <div
                          key={ex.id}
                          onClick={() => setSelectedExerciseId(ex.id)}
                          className={`py-2.5 px-2 flex items-center justify-between gap-3 text-xs cursor-pointer rounded-lg transition-colors ${
                            activeExercise?.id === ex.id
                              ? 'bg-neutral-800/70'
                              : 'hover:bg-neutral-800/30'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-white">{ex.name}</span>
                            <span className="text-neutral-400 ml-2">
                              {ex.muscleGroup} · {ex.equipment}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular-nums text-neutral-400 hidden sm:inline">
                              {ex.defaultSets} × {ex.defaultReps}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBuilderExercise(ex.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                isSelected
                                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                              }`}
                            >
                              {isSelected ? 'Selected' : '+ Select'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Workout History */}
      <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800/80 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Workout History</h3>
            <p className="text-xs text-neutral-400">Previous logged training sessions</p>
          </div>
          <span className="text-xs font-mono tabular-nums text-neutral-400">
            {allPastWorkouts.length} sessions
          </span>
        </div>

        {allPastWorkouts.length > 0 ? (
          <div className="divide-y divide-neutral-800/60">
            {allPastWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{workout.name}</span>
                    <span className="text-xs text-neutral-400 font-mono tabular-nums">
                      · {workout.recordedDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
                    <span>{workout.durationMinutes}m</span>
                    <span>·</span>
                    <span>{workout.exercises.length} exercises</span>
                    <span>·</span>
                    <span className="text-amber-400 font-semibold">
                      -{workout.caloriesBurned} kcal
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <button
                    onClick={() => deleteWorkout(workout.id, workout.recordedDate)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 transition-colors"
                    title="Delete Workout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-neutral-500">
            No workouts logged yet. Select a routine from the dropdown above to begin.
          </div>
        )}
      </div>

      {/* Custom Workout Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Start Custom Workout</h3>
            <form onSubmit={handleStartCustom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1.5">
                  Session Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Upper Body Hypertrophy, Arm Blaster, HIIT..."
                  value={customWorkoutName}
                  onChange={(e) => setCustomWorkoutName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400"
                >
                  Launch Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
