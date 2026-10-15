import React, { useState, useMemo, useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import { formatWorkoutWeight } from '../utils/unitConversion';
import {
  X,
  Dumbbell,
  Clock,
  Flame,
  Play,
  Plus,
} from 'lucide-react';

interface WorkoutTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActiveWorkout: () => void;
}

export const WorkoutTemplateModal: React.FC<WorkoutTemplateModalProps> = ({
  isOpen,
  onClose,
  onOpenActiveWorkout,
}) => {
  const { workoutTemplates, startWorkout, userProfile, unitSystem } = useFitness();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const matched = workoutTemplates.find((t) =>
      t.recommendedGoals?.includes(userProfile.goal)
    );
    return matched?.id || workoutTemplates[0]?.id || '';
  });

  const categories = [
    'all',
    'My Goal',
    'Hypertrophy',
    'Power & Strength',
    'HIIT & Fat Loss',
    'Cardio & Endurance',
    'Bodyweight & Core',
  ];

  const filteredTemplates = useMemo(() => {
    return workoutTemplates.filter((t) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'My Goal') {
        return t.recommendedGoals?.includes(userProfile.goal);
      }
      return t.category.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [workoutTemplates, selectedCategory, userProfile.goal]);

  useEffect(() => {
    if (
      filteredTemplates.length > 0 &&
      !filteredTemplates.some((t) => t.id === selectedTemplateId)
    ) {
      setSelectedTemplateId(filteredTemplates[0].id);
    }
  }, [filteredTemplates, selectedTemplateId]);

  if (!isOpen) return null;

  const selectedTemplate =
    filteredTemplates.find((t) => t.id === selectedTemplateId) ||
    filteredTemplates[0] ||
    workoutTemplates[0];

  const handleSelectTemplate = (templateId?: string) => {
    startWorkout(templateId);
    onClose();
    onOpenActiveWorkout();
  };

  const handleStartEmpty = () => {
    startWorkout(undefined, 'Custom Strength Session');
    onClose();
    onOpenActiveWorkout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Start Workout</h2>
              <p className="text-xs text-neutral-400">Select a training routine from the dropdown</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Dropdown Selection + Single Routine Preview */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[11px] font-semibold text-neutral-400 block">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter workout category"
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-medium text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat === 'My Goal' ? '★ For My Goal' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-8 space-y-1">
              <label className="text-[11px] font-semibold text-neutral-400 block">
                Workout Routine ({filteredTemplates.length})
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
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
          </div>

          {/* Selected Routine Summary */}
          {selectedTemplate && (
            <div className="pt-3 border-t border-neutral-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    {selectedTemplate.category}
                    {selectedTemplate.focusArea ? ` · ${selectedTemplate.focusArea}` : ''}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{selectedTemplate.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{selectedTemplate.description}</p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-neutral-300 shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    ~{selectedTemplate.estimatedMinutes}m
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Flame className="w-3.5 h-3.5" />
                    ~{selectedTemplate.estimatedCalories} kcal
                  </span>
                </div>
              </div>

              <div className="divide-y divide-neutral-800/60 border-y border-neutral-800/80 max-h-48 overflow-y-auto">
                {selectedTemplate.exercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="py-2 flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <span className="font-semibold text-neutral-200">{ex.name}</span>
                      <span className="text-neutral-500 ml-1.5">({ex.targetMuscle})</span>
                    </div>
                    <span className="font-mono tabular-nums text-neutral-400 shrink-0">
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

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartEmpty}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Start Blank Session</span>
            </button>

            {selectedTemplate && (
              <button
                type="button"
                onClick={() => handleSelectTemplate(selectedTemplate.id)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Selected Routine</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
