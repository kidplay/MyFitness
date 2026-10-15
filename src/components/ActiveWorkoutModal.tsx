import React, { useState, useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_LIBRARY } from '../data/initialData';
import { ExerciseLibraryItem, ExerciseMuscleGroup } from '../types';
import {
  formatWorkoutWeight,
  kgToLbs,
  lbsToKg,
} from '../utils/unitConversion';
import {
  X,
  Play,
  Pause,
  Check,
  Plus,
  Trash2,
  Clock,
  Flame,
  Dumbbell,
  Timer,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Home,
} from 'lucide-react';

interface ActiveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MUSCLE_FILTER_TABS: Array<'All' | ExerciseMuscleGroup> = [
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

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeWorkout,
    updateActiveWorkoutSet,
    addActiveWorkoutExercise,
    removeExerciseFromActiveWorkout,
    addSetToExercise,
    removeSetFromExercise,
    applyAIRecommendationToExercise,
    finishActiveWorkout,
    cancelActiveWorkout,
    userProfile,
    unitSystem,
  } = useFitness();

  const isImperial = unitSystem === 'imperial';

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Rest Timer state
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);

  // Add exercise drawer / picker
  const [showAddExercise, setShowAddExercise] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<'All' | ExerciseMuscleGroup>('All');
  const [customExName, setCustomExName] = useState<string>('');
  const [customExMuscle, setCustomExMuscle] = useState<string>('Chest');
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);

  // Workout timer
  useEffect(() => {
    let interval: any = null;
    if (isOpen && activeWorkout && isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, activeWorkout, isTimerRunning]);

  // Rest timer
  useEffect(() => {
    let interval: any = null;
    if (isRestTimerActive && restSecondsLeft !== null && restSecondsLeft > 0) {
      interval = setInterval(() => {
        setRestSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (restSecondsLeft === 0) {
      setIsRestTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRestTimerActive, restSecondsLeft]);

  if (!isOpen || !activeWorkout) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRestTimer = (seconds: number) => {
    setRestSecondsLeft(seconds);
    setIsRestTimerActive(true);
  };

  const handleToggleSet = (exerciseId: string, setIndex: number, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;
    updateActiveWorkoutSet(exerciseId, setIndex, { completed: nextCompleted });

    if (nextCompleted) {
      startRestTimer(60);
    }
  };

  const handleSelectPredefinedExercise = (item: ExerciseLibraryItem) => {
    addActiveWorkoutExercise(
      item.name,
      item.targetMuscle,
      item.category,
      item.defaultWeightKg,
      item.defaultReps
    );
    setShowAddExercise(false);
  };

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExName.trim()) return;
    addActiveWorkoutExercise(customExName.trim(), customExMuscle, 'strength');
    setCustomExName('');
    setShowAddExercise(false);
  };

  // Calculate total volume lifted
  const totalVolumeKg = activeWorkout.exercises.reduce((sum, ex) => {
    return (
      sum +
      ex.sets.reduce((exSum, s) => {
        return s.completed ? exSum + s.weightKg * s.reps : exSum;
      }, 0)
    );
  }, 0);

  const totalCompletedSets = activeWorkout.exercises.reduce((sum, ex) => {
    return sum + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const handleComplete = () => {
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const caloriesBurned = Math.round(durationMinutes * 7.2 * (userProfile.currentWeightKg / 75));
    finishActiveWorkout(durationMinutes, caloriesBurned);
    onClose();
  };

  const handleCancel = () => {
    cancelActiveWorkout();
    setConfirmDiscard(false);
    onClose();
  };

  const filteredLibrary = EXERCISE_LIBRARY.filter((ex) => {
    const matchesMuscle =
      selectedMuscleFilter === 'All' || ex.muscleGroup === selectedMuscleFilter;
    if (!matchesMuscle) return false;
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.targetMuscle.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q) ||
      ex.equipment.toLowerCase().includes(q) ||
      (ex.aliases && ex.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[94vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
              <h2 className="text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-none">
                {activeWorkout.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-neutral-400 font-mono">
              <span className="flex items-center gap-1 text-white font-semibold">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {formatTimer(elapsedSeconds)}
              </span>
              <span>·</span>
              <span>{totalCompletedSets} sets</span>
              <span>·</span>
              <span className="text-amber-400 font-semibold">
                {formatWorkoutWeight(totalVolumeKg, unitSystem)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700 transition-colors"
              title="Keep workout running in background and return to Today's screen"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title={isTimerRunning ? 'Pause' : 'Resume'}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Finish</span>
            </button>

            {confirmDiscard ? (
              <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/40 rounded-xl px-2 py-1">
                <button
                  onClick={handleCancel}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 px-1.5"
                >
                  Confirm Discard
                </button>
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className="text-xs text-neutral-400 hover:text-white px-1"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDiscard(true)}
                className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors"
                title="Cancel & discard workout"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Rest Timer Banner */}
        {isRestTimerActive && restSecondsLeft !== null && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span>Rest Timer: <strong className="font-mono text-sm text-white">{restSecondsLeft}s</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRestSecondsLeft((prev) => (prev ? prev + 15 : 15))}
                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[11px]"
              >
                +15s
              </button>
              <button
                onClick={() => setIsRestTimerActive(false)}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px]"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Exercises Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {activeWorkout.exercises.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <Dumbbell className="w-10 h-10 text-neutral-600 mx-auto" />
              <div className="text-sm font-bold text-white">No exercises in this session yet</div>
              <p className="text-xs text-neutral-400">Click below to add exercises from the library or create a custom move.</p>
              <button
                onClick={() => setShowAddExercise(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
              >
                Add Your First Exercise
              </button>
            </div>
          ) : (
            activeWorkout.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 space-y-3"
              >
                {/* Exercise Header */}
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{exercise.name}</h3>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                      {exercise.targetMuscle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <button
                      onClick={() => startRestTimer(60)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[11px] text-neutral-300 transition-colors"
                    >
                      <Timer className="w-3 h-3 text-emerald-400" />
                      <span>60s Rest</span>
                    </button>

                    <button
                      onClick={() => removeExerciseFromActiveWorkout(exercise.id)}
                      className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AI Progressive Overload Banner */}
                {exercise.aiRecommendation && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="text-[11px] leading-relaxed">
                        <span className="font-bold text-emerald-400 mr-1.5">
                          {exercise.aiRecommendation.badge}:
                        </span>
                        <span className="text-neutral-300">{exercise.aiRecommendation.reason}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => applyAIRecommendationToExercise(exercise.id)}
                      className="self-end sm:self-center px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-all flex items-center gap-1 flex-shrink-0"
                    >
                      <span>
                        Apply Target ({formatWorkoutWeight(exercise.aiRecommendation.suggestedWeightKg, unitSystem)} × {exercise.aiRecommendation.suggestedReps})
                      </span>
                    </button>
                  </div>
                )}

                {/* Sets Table */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-neutral-400 px-2">
                    <div className="col-span-2 text-center">Set</div>
                    <div className="col-span-4 text-center">
                      Weight ({isImperial ? 'lbs' : 'kg'})
                    </div>
                    <div className="col-span-4 text-center">Reps</div>
                    <div className="col-span-2 text-center">Done</div>
                  </div>

                  {exercise.sets.map((set, setIndex) => {
                    const displayWeight = isImperial
                      ? kgToLbs(set.weightKg, 1)
                      : set.weightKg;

                    return (
                      <div
                        key={setIndex}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all ${
                          set.completed
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                            : 'bg-neutral-900 border border-neutral-800/70'
                        }`}
                      >
                        <div className="col-span-2 text-center text-xs font-mono font-bold text-neutral-400">
                          {set.setNumber}
                        </div>

                        <div className="col-span-4 flex items-center justify-center">
                          <input
                            type="number"
                            step={isImperial ? '1' : '0.5'}
                            min="0"
                            value={displayWeight || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const finalKg = isImperial ? lbsToKg(val, 2) : val;
                              updateActiveWorkoutSet(exercise.id, setIndex, {
                                weightKg: finalKg,
                              });
                            }}
                            className="w-14 sm:w-16 bg-neutral-950 border border-neutral-800 rounded-lg px-1 sm:px-2 py-1 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="col-span-4 flex items-center justify-center">
                          <input
                            type="number"
                            min="1"
                            value={set.reps || ''}
                            onChange={(e) =>
                              updateActiveWorkoutSet(exercise.id, setIndex, {
                                reps: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-14 sm:w-16 bg-neutral-950 border border-neutral-800 rounded-lg px-1 sm:px-2 py-1 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="col-span-2 flex items-center justify-center">
                          <button
                            onClick={() =>
                              handleToggleSet(exercise.id, setIndex, set.completed)
                            }
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              set.completed
                                ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                                : 'bg-neutral-950 border border-neutral-700 text-neutral-500 hover:text-white'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add / Remove Set Row */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() => addSetToExercise(exercise.id)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Set</span>
                  </button>

                  {exercise.sets.length > 1 && (
                    <button
                      onClick={() =>
                        removeSetFromExercise(exercise.id, exercise.sets.length - 1)
                      }
                      className="text-neutral-500 hover:text-rose-400 text-[11px]"
                    >
                      Remove Set
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Quick Action: Add More Exercises button */}
          {activeWorkout.exercises.length > 0 && !showAddExercise && (
            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full py-3 rounded-2xl bg-neutral-950 border border-dashed border-neutral-800 hover:border-emerald-500/50 text-neutral-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Another Exercise to Workout</span>
            </button>
          )}

          {/* Add Exercise Modal / Form */}
          {showAddExercise && (
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Select Exercise or Create Custom
                  </span>
                </div>
                <button
                  onClick={() => setShowAddExercise(false)}
                  className="text-neutral-500 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              {/* Search predefined */}
              <input
                type="text"
                placeholder="Search 55+ exercises (e.g. Dumbbell Flyes, Tricep Press, French Press, Skull Crushers)..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              {/* Muscle Group Filter Buttons */}
              <div className="flex flex-wrap gap-1">
                {MUSCLE_FILTER_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedMuscleFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      selectedMuscleFilter === tab
                        ? 'bg-emerald-500 text-neutral-950 font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Quick Exercise Chips from Library */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredLibrary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPredefinedExercise(item)}
                    className="w-full p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/80 text-left flex items-center justify-between text-xs transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {item.muscleGroup} · {item.equipment} · {item.targetMuscle}
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono tabular-nums ml-2 flex-shrink-0">
                      {item.defaultSets}×{item.defaultReps}{' '}
                      {item.defaultWeightKg > 0
                        ? `@ ${formatWorkoutWeight(item.defaultWeightKg, unitSystem)}`
                        : 'BW'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Or create custom */}
              <form onSubmit={handleAddCustomExercise} className="pt-2 border-t border-neutral-800 space-y-2">
                <div className="text-[11px] text-neutral-400 font-semibold">Or enter custom movement:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Movement name"
                    value={customExName}
                    onChange={(e) => setCustomExName(e.target.value)}
                    className="sm:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={customExMuscle}
                    onChange={(e) => setCustomExMuscle(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Legs">Legs</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                    <option value="Cardio">Cardio</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!customExName.trim()}
                  className="w-full py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                >
                  Add Custom Movement
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
