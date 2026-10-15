import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  DayRecord,
  FoodItem,
  MealType,
  Workout,
  Exercise,
  ExerciseSet,
  WeightLog,
  FoodDatabaseItem,
  FitnessGoal,
  Milestone,
  AIExerciseRecommendation,
  UnitSystem,
} from '../types';
import { KG_TO_LBS } from '../utils/unitConversion';
import {
  INITIAL_USER_PROFILE,
  generateInitialWeightLogs,
  getInitialDayRecords,
  getTodayDateString,
  COMMON_FOOD_DATABASE,
  WORKOUT_TEMPLATES,
} from '../data/initialData';

interface FitnessContextType {
  userProfile: UserProfile;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dayRecords: Record<string, DayRecord>;
  todayRecord: DayRecord;
  weightLogs: WeightLog[];
  activeWorkout: Workout | null;
  workoutTemplates: typeof WORKOUT_TEMPLATES;
  customFoods: FoodDatabaseItem[];

  // Profile actions
  updateProfile: (profile: Partial<UserProfile>) => void;
  recalculateTargets: () => void;
  unitSystem: UnitSystem;
  toggleUnitSystem: () => void;
  setUnitSystem: (system: UnitSystem) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  completeOnboarding: (profileData: Partial<UserProfile>) => void;

  // Nutrition actions
  addFoodItem: (mealType: MealType, item: Omit<FoodItem, 'id' | 'timestamp'>, date?: string) => void;
  removeFoodItem: (mealType: MealType, itemId: string, date?: string) => void;
  updateFoodItem: (mealType: MealType, itemId: string, updates: Partial<FoodItem>, date?: string) => void;
  addCustomFood: (food: Omit<FoodDatabaseItem, 'id'>) => void;
  copyYesterdayMeals: () => boolean;

  // Workout actions
  isWorkoutTemplateModalOpen: boolean;
  setIsWorkoutTemplateModalOpen: (open: boolean) => void;
  startWorkout: (
    templateId?: string,
    customName?: string,
    customExercises?: Array<{
      name: string;
      targetMuscle: string;
      defaultSets: number;
      defaultReps: number;
      defaultWeightKg: number;
      category: 'strength' | 'cardio' | 'bodyweight';
    }>
  ) => void;
  updateActiveWorkoutSet: (exerciseId: string, setIndex: number, updates: Partial<ExerciseSet>) => void;
  addActiveWorkoutExercise: (name: string, targetMuscle: string, category?: 'strength' | 'cardio' | 'bodyweight', defaultWeight?: number, defaultReps?: number) => void;
  removeExerciseFromActiveWorkout: (exerciseId: string) => void;
  addSetToExercise: (exerciseId: string) => void;
  removeSetFromExercise: (exerciseId: string, setIndex: number) => void;
  applyAIRecommendationToExercise: (exerciseId: string) => void;
  finishActiveWorkout: (durationMinutes?: number, caloriesBurned?: number) => void;
  cancelActiveWorkout: () => void;
  deleteWorkout: (workoutId: string, date?: string) => void;

  // Weight actions
  logWeight: (weightKg: number, date?: string, note?: string) => void;
  deleteWeightLog: (id: string) => void;

  // Stats, Milestones & History
  getNutritionalTotalsForDate: (dateStr: string) => {
    consumedCalories: number;
    consumedProtein: number;
    consumedCarbs: number;
    consumedFat: number;
    burnedCalories: number;
    remainingCalories: number;
  };
  streakDays: number;
  milestones: Milestone[];
  getExerciseHistory: (exerciseName: string) => Array<{
    date: string;
    maxWeight: number;
    totalVolume: number;
    totalReps: number;
  }>;
  resetAllData: () => void;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'myfitness_profile_v2',
  RECORDS: 'myfitness_records_v2',
  WEIGHT: 'myfitness_weight_v2',
  CUSTOM_FOOD: 'myfitness_custom_foods_v2',
};

// Age calculation helper (timezone-safe)
export function calculateAge(birthDate: string): number {
  if (!birthDate) return 25;
  const parts = birthDate.split('-');
  if (parts.length < 3) return 25;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return 25;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return Math.max(1, Math.min(120, age));
}

// Body Mass Index (BMI) calculation & classification helper
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
  color: string;
  healthyWeightMin: number;
  healthyWeightMax: number;
} {
  const w = weightKg && weightKg > 0 && !isNaN(weightKg) ? weightKg : 75;
  const h = heightCm && heightCm > 0 && !isNaN(heightCm) ? heightCm : 175;
  const heightMeters = h / 100;
  const bmiValue = Number((w / (heightMeters * heightMeters)).toFixed(1));

  let category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity' = 'Normal weight';
  let color = '#10b981'; // emerald
  if (bmiValue < 18.5) {
    category = 'Underweight';
    color = '#38bdf8'; // sky
  } else if (bmiValue < 25.0) {
    category = 'Normal weight';
    color = '#10b981'; // emerald
  } else if (bmiValue < 30.0) {
    category = 'Overweight';
    color = '#f59e0b'; // amber
  } else {
    category = 'Obesity';
    color = '#ef4444'; // red
  }

  const healthyWeightMin = Number((18.5 * heightMeters * heightMeters).toFixed(1));
  const healthyWeightMax = Number((24.9 * heightMeters * heightMeters).toFixed(1));

  return {
    bmi: bmiValue,
    category,
    color,
    healthyWeightMin,
    healthyWeightMax,
  };
}

// Scientific BMR & TDEE calculation (Mifflin-St Jeor formula) across 7 Fitness Goals
export function computeNutritionTargets(profile: Partial<UserProfile>): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
} {
  const weight = profile.currentWeightKg || 75;
  const height = profile.heightCm || 175;
  const age = profile.birthDate ? calculateAge(profile.birthDate) : (profile.age || 25);
  const gender = profile.gender || 'male';
  const activity = profile.activityLevel || 'moderate';
  const goal: FitnessGoal = profile.goal || 'lose_weight';

  // BMI
  const bmiInfo = calculateBMI(weight, height);

  // Mifflin-St Jeor:
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };

  const tdee = Math.round(bmr * (activityMultipliers[activity] || 1.55));

  let targetCalories = tdee;
  let proteinMultiplier = 2.0;
  let fatPct = 0.28;

  switch (goal) {
    case 'lose_weight':
      targetCalories = Math.max(1400, Math.round(tdee - 500));
      proteinMultiplier = 2.2;
      fatPct = 0.25;
      break;
    case 'mild_fat_loss':
      targetCalories = Math.max(1500, Math.round(tdee - 250));
      proteinMultiplier = 2.0;
      fatPct = 0.27;
      break;
    case 'maintain':
      targetCalories = tdee;
      proteinMultiplier = 1.8;
      fatPct = 0.28;
      break;
    case 'lean_bulk':
      targetCalories = Math.round(tdee + 250);
      proteinMultiplier = 2.1;
      fatPct = 0.26;
      break;
    case 'aggressive_bulk':
      targetCalories = Math.round(tdee + 450);
      proteinMultiplier = 2.0;
      fatPct = 0.28;
      break;
    case 'strength_power':
      targetCalories = Math.round(tdee + 150);
      proteinMultiplier = 2.3;
      fatPct = 0.26;
      break;
    case 'endurance':
      targetCalories = Math.round(tdee + 200);
      proteinMultiplier = 1.6;
      fatPct = 0.22;
      break;
    default:
      targetCalories = Math.max(1400, Math.round(tdee - 450));
      proteinMultiplier = 2.1;
      fatPct = 0.28;
  }

  const targetProtein = Math.round(weight * proteinMultiplier);
  const targetFat = Math.round((targetCalories * fatPct) / 9);
  const proteinCals = targetProtein * 4;
  const fatCals = targetFat * 9;
  const targetCarbs = Math.max(50, Math.round((targetCalories - proteinCals - fatCals) / 4));

  return {
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: targetFat,
    bmi: bmiInfo.bmi,
    bmiCategory: bmiInfo.category,
  };
}

// Progressive Overload AI Recommendation generator
export function generateAIProgressiveRecommendation(
  exerciseName: string,
  currentWeightKg: number,
  currentReps: number,
  goal: FitnessGoal,
  previousHistory?: { weightKg: number; reps: number; completedAll: boolean }
): AIExerciseRecommendation {
  const isHypertrophyOrStrength =
    goal === 'lean_bulk' ||
    goal === 'aggressive_bulk' ||
    goal === 'strength_power';

  if (!previousHistory) {
    return {
      suggestedWeightKg: currentWeightKg,
      suggestedReps: currentReps,
      reason: 'Baseline established. Focus on crisp mechanical execution and full range of motion.',
      type: 'maintain',
      badge: 'Baseline Routine',
    };
  }

  if (previousHistory.completedAll) {
    if (isHypertrophyOrStrength) {
      const increment = previousHistory.weightKg >= 40 ? 2.5 : 1.25;
      const nextWeight = Number((previousHistory.weightKg + increment).toFixed(1));
      return {
        suggestedWeightKg: nextWeight,
        suggestedReps: Math.max(6, previousHistory.reps - 1),
        reason: `Previous session finished all sets at ${previousHistory.weightKg}kg. AI progressive overload recommends bumping +${increment}kg.`,
        type: 'increase_weight',
        badge: `+${increment}kg Overload`,
      };
    } else if (goal === 'lose_weight' || goal === 'mild_fat_loss') {
      return {
        suggestedWeightKg: previousHistory.weightKg,
        suggestedReps: previousHistory.reps + 1,
        reason: `Deficit preservation: Hold weight steady at ${previousHistory.weightKg}kg and aim for +1 rep to elevate work capacity.`,
        type: 'increase_reps',
        badge: '+1 Rep Density',
      };
    } else {
      return {
        suggestedWeightKg: previousHistory.weightKg,
        suggestedReps: previousHistory.reps + 2,
        reason: `Endurance conditioning: Progress with +2 reps per set while maintaining pace and form.`,
        type: 'increase_reps',
        badge: '+2 Reps Stamina',
      };
    }
  } else {
    return {
      suggestedWeightKg: previousHistory.weightKg,
      suggestedReps: previousHistory.reps,
      reason: `Consolidate ${previousHistory.weightKg}kg until all sets hit target reps with clean form before progressing weight.`,
      type: 'maintain',
      badge: 'Form Consolidation',
    };
  }
}

export const FitnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronized today date from user's phone locale
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString(0));

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isWorkoutTemplateModalOpen, setIsWorkoutTemplateModalOpen] = useState<boolean>(false);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read error', e);
    }
    return INITIAL_USER_PROFILE;
  });

  // Daily records (meals and workouts)
  const [dayRecords, setDayRecords] = useState<Record<string, DayRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read error', e);
    }
    return getInitialDayRecords();
  });

  // Weight progression logs
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEIGHT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read error', e);
    }
    return generateInitialWeightLogs();
  });

  // Custom user-added foods
  const [customFoods, setCustomFoods] = useState<FoodDatabaseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_FOOD);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read error', e);
    }
    return [];
  });

  // Active workout
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(dayRecords));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [dayRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(weightLogs));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [weightLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_FOOD, JSON.stringify(customFoods));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [customFoods]);

  // Keep date synchronized with phone's real local day & renew fresh day
  useEffect(() => {
    const timer = setInterval(() => {
      const realToday = getTodayDateString(0);
      setDayRecords((prev) => {
        if (!prev[realToday]) {
          return {
            ...prev,
            [realToday]: {
              date: realToday,
              meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
              workouts: [],
            },
          };
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Check onboarding requirement
  useEffect(() => {
    if (!userProfile.onboarded && (!userProfile.name || userProfile.name === 'New User')) {
      setIsOnboardingOpen(true);
    }
  }, [userProfile]);

  // Ensure record exists for requested date
  const getEnsureRecord = (dateStr: string, currentRecords = dayRecords): DayRecord => {
    if (currentRecords[dateStr]) return currentRecords[dateStr];
    return {
      date: dateStr,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      },
      workouts: [],
    };
  };

  const todayRecord = getEnsureRecord(selectedDate);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };

      if (updates.birthDate) {
        next.age = calculateAge(updates.birthDate);
      }

      const bmiData = calculateBMI(next.currentWeightKg, next.heightCm);
      next.bmi = bmiData.bmi;
      next.bmiCategory = bmiData.category;

      if (
        updates.currentWeightKg ||
        updates.heightCm ||
        updates.age ||
        updates.birthDate ||
        updates.activityLevel ||
        updates.goal ||
        updates.gender
      ) {
        const calculated = computeNutritionTargets(next);
        return {
          ...next,
          targetCalories: calculated.calories,
          targetProtein: calculated.protein,
          targetCarbs: calculated.carbs,
          targetFat: calculated.fat,
          bmi: calculated.bmi,
          bmiCategory: calculated.bmiCategory,
        };
      }
      return next;
    });
  };

  const completeOnboarding = (profileData: Partial<UserProfile>) => {
    updateProfile({
      ...profileData,
      onboarded: true,
    });
    setIsOnboardingOpen(false);
  };

  const recalculateTargets = () => {
    const calculated = computeNutritionTargets(userProfile);
    setUserProfile((prev) => ({
      ...prev,
      age: userProfile.birthDate ? calculateAge(userProfile.birthDate) : userProfile.age,
      targetCalories: calculated.calories,
      targetProtein: calculated.protein,
      targetCarbs: calculated.carbs,
      targetFat: calculated.fat,
      bmi: calculated.bmi,
      bmiCategory: calculated.bmiCategory,
    }));
  };

  const unitSystem: UnitSystem = userProfile.unitSystem || 'metric';

  const toggleUnitSystem = () => {
    const nextSystem: UnitSystem = unitSystem === 'imperial' ? 'metric' : 'imperial';
    updateProfile({ unitSystem: nextSystem });
  };

  const setUnitSystem = (system: UnitSystem) => {
    updateProfile({ unitSystem: system });
  };

  // Nutrition Actions
  const addFoodItem = (
    mealType: MealType,
    item: Omit<FoodItem, 'id' | 'timestamp'>,
    date = selectedDate
  ) => {
    const newItem: FoodItem = {
      ...item,
      id: 'food-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDayRecords((prev) => {
      const existing = getEnsureRecord(date, prev);
      const updatedMeals = {
        ...existing.meals,
        [mealType]: [...existing.meals[mealType], newItem],
      };
      return {
        ...prev,
        [date]: {
          ...existing,
          meals: updatedMeals,
        },
      };
    });
  };

  const removeFoodItem = (mealType: MealType, itemId: string, date = selectedDate) => {
    setDayRecords((prev) => {
      const existing = getEnsureRecord(date, prev);
      const updatedMeals = {
        ...existing.meals,
        [mealType]: existing.meals[mealType].filter((f) => f.id !== itemId),
      };
      return {
        ...prev,
        [date]: {
          ...existing,
          meals: updatedMeals,
        },
      };
    });
  };

  const updateFoodItem = (
    mealType: MealType,
    itemId: string,
    updates: Partial<FoodItem>,
    date = selectedDate
  ) => {
    setDayRecords((prev) => {
      const existing = getEnsureRecord(date, prev);
      const updatedMeals = {
        ...existing.meals,
        [mealType]: existing.meals[mealType].map((f) => (f.id === itemId ? { ...f, ...updates } : f)),
      };
      return {
        ...prev,
        [date]: {
          ...existing,
          meals: updatedMeals,
        },
      };
    });
  };

  const addCustomFood = (foodData: Omit<FoodDatabaseItem, 'id'>) => {
    const newFood: FoodDatabaseItem = {
      ...foodData,
      id: 'custom-' + Date.now(),
    };
    setCustomFoods((prev) => [newFood, ...prev]);
  };

  const copyYesterdayMeals = (): boolean => {
    const yesterdayDate = getTodayDateString(-1);
    const yesterdayRecord = dayRecords[yesterdayDate];
    if (!yesterdayRecord) return false;

    const hasMeals =
      yesterdayRecord.meals.breakfast.length > 0 ||
      yesterdayRecord.meals.lunch.length > 0 ||
      yesterdayRecord.meals.dinner.length > 0 ||
      yesterdayRecord.meals.snacks.length > 0;

    if (!hasMeals) return false;

    setDayRecords((prev) => {
      const todayRec = getEnsureRecord(selectedDate, prev);
      return {
        ...prev,
        [selectedDate]: {
          ...todayRec,
          meals: {
            breakfast: yesterdayRecord.meals.breakfast.map((m) => ({ ...m, id: 'c-bf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4) })),
            lunch: yesterdayRecord.meals.lunch.map((m) => ({ ...m, id: 'c-lu-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4) })),
            dinner: yesterdayRecord.meals.dinner.map((m) => ({ ...m, id: 'c-dn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4) })),
            snacks: yesterdayRecord.meals.snacks.map((m) => ({ ...m, id: 'c-sn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4) })),
          },
        },
      };
    });
    return true;
  };

  // Previous exercise stats lookup for AI recommendation
  const getPreviousExerciseStats = (exerciseName: string) => {
    const sortedDates = Object.keys(dayRecords).sort((a, b) => b.localeCompare(a));
    for (const d of sortedDates) {
      const rec = dayRecords[d];
      for (const w of rec.workouts) {
        const found = w.exercises.find(
          (e) => e.name.toLowerCase().trim() === exerciseName.toLowerCase().trim()
        );
        if (found && found.sets.length > 0) {
          const completedSets = found.sets.filter((s) => s.completed);
          const maxWeight = Math.max(...found.sets.map((s) => s.weightKg), 0);
          const avgReps = Math.round(
            found.sets.reduce((sum, s) => sum + s.reps, 0) / found.sets.length
          );
          const completedAll = completedSets.length === found.sets.length && found.sets.length >= 2;
          return {
            date: d,
            weightKg: maxWeight,
            reps: avgReps,
            completedAll,
          };
        }
      }
    }
    return undefined;
  };

  // Workout Actions
  const startWorkout = (
    templateId?: string,
    customName?: string,
    customExercises?: Array<{
      name: string;
      targetMuscle: string;
      defaultSets: number;
      defaultReps: number;
      defaultWeightKg: number;
      category: 'strength' | 'cardio' | 'bodyweight';
    }>
  ) => {
    const template = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
    const workoutName = customName || template?.name || 'Custom Workout';
    const sourceExercises = customExercises && customExercises.length > 0 ? customExercises : template?.exercises;

    const exercises: Exercise[] = sourceExercises
      ? sourceExercises.map((ex, i) => {
          const prevStats = getPreviousExerciseStats(ex.name);
          const aiRec = generateAIProgressiveRecommendation(
            ex.name,
            ex.defaultWeightKg,
            ex.defaultReps,
            userProfile.goal,
            prevStats
          );
          return {
            id: 'ex-' + i + '-' + Date.now(),
            name: ex.name,
            targetMuscle: ex.targetMuscle,
            category: ex.category,
            sets: Array.from({ length: ex.defaultSets }, (_, sIdx) => ({
              setNumber: sIdx + 1,
              weightKg: aiRec.suggestedWeightKg || ex.defaultWeightKg,
              reps: aiRec.suggestedReps || ex.defaultReps,
              completed: false,
            })),
            aiRecommendation: aiRec,
          };
        })
      : [
          {
            id: 'ex-0-' + Date.now(),
            name: 'Barbell Flat Bench Press',
            targetMuscle: 'Chest',
            category: 'strength',
            sets: [
              { setNumber: 1, weightKg: 60, reps: 10, completed: false },
              { setNumber: 2, weightKg: 60, reps: 8, completed: false },
              { setNumber: 3, weightKg: 65, reps: 6, completed: false },
            ],
            aiRecommendation: {
              suggestedWeightKg: 60,
              suggestedReps: 10,
              reason: 'Baseline bench press routine. Warm up rotator cuffs before loading heavy.',
              type: 'maintain',
              badge: 'Target 60kg',
            },
          },
        ];

    setActiveWorkout({
      id: 'w-' + Date.now(),
      name: workoutName,
      date: selectedDate,
      durationMinutes: 0,
      caloriesBurned: template?.estimatedCalories || Math.max(200, exercises.length * 60),
      exercises,
      completed: false,
      category: template?.category || 'Strength',
    });
  };

  const updateActiveWorkoutSet = (
    exerciseId: string,
    setIndex: number,
    updates: Partial<ExerciseSet>
  ) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const nextSets = [...ex.sets];
          nextSets[setIndex] = { ...nextSets[setIndex], ...updates };
          return { ...ex, sets: nextSets };
        }),
      };
    });
  };

  const addActiveWorkoutExercise = (
    name: string,
    targetMuscle: string,
    category: 'strength' | 'cardio' | 'bodyweight' = 'strength',
    defaultWeight = 20,
    defaultReps = 10
  ) => {
    if (!activeWorkout) return;
    const prevStats = getPreviousExerciseStats(name);
    const aiRec = generateAIProgressiveRecommendation(
      name,
      defaultWeight,
      defaultReps,
      userProfile.goal,
      prevStats
    );

    const newExercise: Exercise = {
      id: 'ex-' + Date.now(),
      name,
      targetMuscle,
      category,
      sets: [
        { setNumber: 1, weightKg: aiRec.suggestedWeightKg || defaultWeight, reps: aiRec.suggestedReps || defaultReps, completed: false },
        { setNumber: 2, weightKg: aiRec.suggestedWeightKg || defaultWeight, reps: aiRec.suggestedReps || defaultReps, completed: false },
        { setNumber: 3, weightKg: aiRec.suggestedWeightKg || defaultWeight, reps: aiRec.suggestedReps || defaultReps, completed: false },
      ],
      aiRecommendation: aiRec,
    };

    setActiveWorkout((prev) => {
      if (!prev) return null;
      return { ...prev, exercises: [...prev.exercises, newExercise] };
    });
  };

  const removeExerciseFromActiveWorkout = (exerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
      };
    });
  };

  const applyAIRecommendationToExercise = (exerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId || !ex.aiRecommendation) return ex;
          const { suggestedWeightKg, suggestedReps } = ex.aiRecommendation;
          return {
            ...ex,
            sets: ex.sets.map((s) => ({
              ...s,
              weightKg: suggestedWeightKg,
              reps: suggestedReps,
            })),
          };
        }),
      };
    });
  };

  const addSetToExercise = (exerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: ExerciseSet = {
            setNumber: ex.sets.length + 1,
            weightKg: lastSet ? lastSet.weightKg : 20,
            reps: lastSet ? lastSet.reps : 10,
            completed: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      };
    });
  };

  const removeSetFromExercise = (exerciseId: string, setIndex: number) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          if (ex.sets.length <= 1) return ex;
          const nextSets = ex.sets.filter((_, idx) => idx !== setIndex);
          return {
            ...ex,
            sets: nextSets.map((s, idx) => ({ ...s, setNumber: idx + 1 })),
          };
        }),
      };
    });
  };

  const finishActiveWorkout = (durationMinutes = 45, customBurn?: number) => {
    if (!activeWorkout) return;
    const burned =
      customBurn ||
      Math.round(durationMinutes * 6.8 * (userProfile.currentWeightKg / 75));

    const finishedWorkout: Workout = {
      ...activeWorkout,
      durationMinutes,
      caloriesBurned: burned,
      completed: true,
    };

    setDayRecords((prev) => {
      const existing = getEnsureRecord(activeWorkout.date, prev);
      return {
        ...prev,
        [activeWorkout.date]: {
          ...existing,
          workouts: [finishedWorkout, ...existing.workouts],
        },
      };
    });

    setActiveWorkout(null);
  };

  const cancelActiveWorkout = () => {
    setActiveWorkout(null);
  };

  const deleteWorkout = (workoutId: string, date = selectedDate) => {
    setDayRecords((prev) => {
      const existing = getEnsureRecord(date, prev);
      return {
        ...prev,
        [date]: {
          ...existing,
          workouts: existing.workouts.filter((w) => w.id !== workoutId),
        },
      };
    });
  };

  // Weight Actions
  const logWeight = (weightKg: number, date = selectedDate, note?: string) => {
    const newLog: WeightLog = {
      id: 'w-' + Date.now(),
      date,
      weightKg,
      note,
    };

    setWeightLogs((prev) => {
      const filtered = prev.filter((l) => l.date !== date);
      return [...filtered, newLog].sort((a, b) => a.date.localeCompare(b.date));
    });

    updateProfile({ currentWeightKg: weightKg });
  };

  const deleteWeightLog = (id: string) => {
    setWeightLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // Stats for a particular date
  const getNutritionalTotalsForDate = (dateStr: string) => {
    const record = dayRecords[dateStr];
    if (!record) {
      return {
        consumedCalories: 0,
        consumedProtein: 0,
        consumedCarbs: 0,
        consumedFat: 0,
        burnedCalories: 0,
        remainingCalories: userProfile.targetCalories || 2200,
      };
    }

    const allItems = [
      ...record.meals.breakfast,
      ...record.meals.lunch,
      ...record.meals.dinner,
      ...record.meals.snacks,
    ];

    const consumedCalories = allItems.reduce((sum, item) => {
      const mult = item.servingMultiplier || 1;
      return sum + Math.round(item.calories * mult);
    }, 0);

    const consumedProtein = allItems.reduce((sum, item) => {
      const mult = item.servingMultiplier || 1;
      return sum + Math.round(item.protein * mult);
    }, 0);

    const consumedCarbs = allItems.reduce((sum, item) => {
      const mult = item.servingMultiplier || 1;
      return sum + Math.round(item.carbs * mult);
    }, 0);

    const consumedFat = allItems.reduce((sum, item) => {
      const mult = item.servingMultiplier || 1;
      return sum + Math.round(item.fat * mult);
    }, 0);

    const burnedCalories = record.workouts.reduce(
      (sum, w) => sum + (w.caloriesBurned || 0),
      0
    );

    const target = userProfile.targetCalories || 2200;
    const remainingCalories = target - consumedCalories + burnedCalories;

    return {
      consumedCalories,
      consumedProtein,
      consumedCarbs,
      consumedFat,
      burnedCalories,
      remainingCalories,
    };
  };

  // Streak days calculation
  const streakDays = useMemo(() => {
    let count = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkD = new Date(today);
      checkD.setDate(today.getDate() - i);
      const year = checkD.getFullYear();
      const month = String(checkD.getMonth() + 1).padStart(2, '0');
      const day = String(checkD.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const rec = dayRecords[dateStr];
      const hasFood =
        rec &&
        (rec.meals.breakfast.length > 0 ||
          rec.meals.lunch.length > 0 ||
          rec.meals.dinner.length > 0 ||
          rec.meals.snacks.length > 0);
      const hasWorkout = rec && rec.workouts.length > 0;

      if (hasFood || hasWorkout) {
        count++;
      } else if (i === 0) {
        // Today might not be logged yet, don't break streak if yesterday was logged
        continue;
      } else {
        break;
      }
    }
    return Math.max(1, count);
  }, [dayRecords]);

  // Exercise history lookup for Strength Progression charts
  const getExerciseHistory = (exerciseName: string) => {
    const results: Array<{
      date: string;
      maxWeight: number;
      totalVolume: number;
      totalReps: number;
    }> = [];

    const sortedDates = Object.keys(dayRecords).sort();
    for (const d of sortedDates) {
      const rec = dayRecords[d];
      for (const w of rec.workouts) {
        const found = w.exercises.find(
          (e) => e.name.toLowerCase().trim() === exerciseName.toLowerCase().trim()
        );
        if (found && found.sets.length > 0) {
          const maxWeight = Math.max(...found.sets.map((s) => s.weightKg), 0);
          const totalVol = found.sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
          const totalR = found.sets.reduce((acc, s) => acc + s.reps, 0);
          results.push({
            date: d,
            maxWeight,
            totalVolume: totalVol,
            totalReps: totalR,
          });
        }
      }
    }
    return results;
  };

  // Milestones Calculation
  const milestones: Milestone[] = useMemo(() => {
    const startW = weightLogs[0]?.weightKg || userProfile.currentWeightKg;
    const currentW = userProfile.currentWeightKg;
    const targetW = userProfile.targetWeightKg;
    const isLosing = userProfile.goal === 'lose_weight' || userProfile.goal === 'mild_fat_loss';
    const totalLost = Math.max(0, startW - currentW);
    const weightGoalGap = Math.abs(startW - targetW) || 1;

    const allWorkouts = Object.values(dayRecords).flatMap((r) => r.workouts);
    const totalWorkoutsCount = allWorkouts.length;
    const totalVolumeTonnage = allWorkouts.reduce((sum, w) => {
      const wVol = w.exercises.reduce((exSum, ex) => {
        return exSum + ex.sets.reduce((sSum, s) => sSum + (s.completed ? s.weightKg * s.reps : 0), 0);
      }, 0);
      return sum + wVol;
    }, 0);

    const daysWithLoggedFood = Object.values(dayRecords).filter((r) => {
      const items = [...r.meals.breakfast, ...r.meals.lunch, ...r.meals.dinner, ...r.meals.snacks];
      const protein = items.reduce((p, item) => p + item.protein * (item.servingMultiplier || 1), 0);
      return protein >= (userProfile.targetProtein || 150) * 0.85;
    }).length;

    const isImperial = userProfile.unitSystem === 'imperial';
    const weightDropCurrent = isImperial
      ? Number((totalLost * KG_TO_LBS).toFixed(1))
      : Number(totalLost.toFixed(1));
    const weightDropTarget = isImperial ? 2.2 : 1.0;
    const weightUnit = isImperial ? 'lbs' : 'kg';
    const halfGoalTarget = isImperial
      ? Number(((weightGoalGap / 2) * KG_TO_LBS).toFixed(1))
      : Number((weightGoalGap / 2).toFixed(1));
    const halfGoalCurrent = isImperial
      ? Number((Math.min(weightGoalGap / 2, totalLost) * KG_TO_LBS).toFixed(1))
      : Number(Math.min(weightGoalGap / 2, totalLost).toFixed(1));
    const targetWDisplay = isImperial
      ? `${Number((targetW * KG_TO_LBS).toFixed(1))} lbs`
      : `${targetW} kg`;
    const tonnageTarget = isImperial ? 22000 : 10000;
    const tonnageCurrent = isImperial
      ? Math.min(22000, Math.round(totalVolumeTonnage * KG_TO_LBS))
      : Math.min(10000, Math.round(totalVolumeTonnage));
    const tonnageUnit = isImperial ? 'lbs' : 'kg';

    return [
      {
        id: 'm-w-1',
        title: isImperial ? 'First 2.2 lbs Drop' : 'First 1 kg Drop',
        category: 'weight',
        currentValue: weightDropCurrent,
        targetValue: weightDropTarget,
        unit: weightUnit,
        completed: totalLost >= 1.0,
        rewardIcon: '🎯',
        description: isImperial
          ? 'First 2.2 lbs (1 kg) shed on your personal transformation journey.'
          : 'First kilo of fat shed on your personal transformation journey.',
      },
      {
        id: 'm-w-2',
        title: isLosing ? 'Halfway to Goal Weight' : 'Halfway to Target Mass',
        category: 'weight',
        currentValue: halfGoalCurrent,
        targetValue: halfGoalTarget,
        unit: weightUnit,
        completed: totalLost >= weightGoalGap / 2,
        rewardIcon: '⚡',
        description: `Crossed the 50% threshold toward target weight of ${targetWDisplay}.`,
      },
      {
        id: 'm-w-3',
        title: 'Goal Weight Achieved',
        category: 'weight',
        currentValue: isImperial
          ? Number((Math.min(weightGoalGap, totalLost) * KG_TO_LBS).toFixed(1))
          : Number(Math.min(weightGoalGap, totalLost).toFixed(1)),
        targetValue: isImperial
          ? Number((weightGoalGap * KG_TO_LBS).toFixed(1))
          : Number(weightGoalGap.toFixed(1)),
        unit: weightUnit,
        completed: Math.abs(currentW - targetW) <= 0.3,
        rewardIcon: '🏆',
        description: `Successfully reached your fitness goal of ${targetWDisplay}!`,
      },
      {
        id: 'm-s-1',
        title: '3-Day Ignition Streak',
        category: 'streak',
        currentValue: Math.min(3, streakDays),
        targetValue: 3,
        unit: 'days',
        completed: streakDays >= 3,
        rewardIcon: '🔥',
        description: 'Three consecutive days of tracking nutrition and physical training.',
      },
      {
        id: 'm-s-2',
        title: '7-Day Habit Champion',
        category: 'streak',
        currentValue: Math.min(7, streakDays),
        targetValue: 7,
        unit: 'days',
        completed: streakDays >= 7,
        rewardIcon: '⭐',
        description: 'One full week of discipline and consistent health tracking.',
      },
      {
        id: 'm-s-3',
        title: '30-Day Elite Transformation',
        category: 'streak',
        currentValue: Math.min(30, streakDays),
        targetValue: 30,
        unit: 'days',
        completed: streakDays >= 30,
        rewardIcon: '👑',
        description: '30 days of dedication. Fitness is now your permanent routine.',
      },
      {
        id: 'm-wo-1',
        title: 'First Workout Completed',
        category: 'workout',
        currentValue: Math.min(1, totalWorkoutsCount),
        targetValue: 1,
        unit: 'session',
        completed: totalWorkoutsCount >= 1,
        rewardIcon: '🏋️',
        description: 'Logged your very first workout session in the app.',
      },
      {
        id: 'm-wo-2',
        title: '10 Workouts Logged',
        category: 'workout',
        currentValue: Math.min(10, totalWorkoutsCount),
        targetValue: 10,
        unit: 'workouts',
        completed: totalWorkoutsCount >= 10,
        rewardIcon: '💪',
        description: 'Completed 10 workouts across strength, cardio, and hypertrophy.',
      },
      {
        id: 'm-wo-3',
        title: isImperial ? '22,000 lbs Tonnage Club' : '10,000 kg Tonnage Club',
        category: 'workout',
        currentValue: tonnageCurrent,
        targetValue: tonnageTarget,
        unit: tonnageUnit,
        completed: totalVolumeTonnage >= 10000,
        rewardIcon: '🚀',
        description: isImperial
          ? 'Lifted over 22,000 lbs (10 metric tons) of total cumulative volume.'
          : 'Lifted over 10 metric tons of total cumulative volume.',
      },
      {
        id: 'm-nu-1',
        title: 'Protein Master (5 Days)',
        category: 'nutrition',
        currentValue: Math.min(5, daysWithLoggedFood),
        targetValue: 5,
        unit: 'days',
        completed: daysWithLoggedFood >= 5,
        rewardIcon: '🥩',
        description: 'Met your daily protein target on 5 separate days.',
      },
    ];
  }, [weightLogs, userProfile, dayRecords, streakDays]);

  const resetAllData = () => {
    localStorage.clear();
    setUserProfile(INITIAL_USER_PROFILE);
    setDayRecords(getInitialDayRecords());
    setWeightLogs(generateInitialWeightLogs());
    setCustomFoods([]);
    setActiveWorkout(null);
    setSelectedDate(getTodayDateString(0));
  };

  return (
    <FitnessContext.Provider
      value={{
        userProfile,
        selectedDate,
        setSelectedDate,
        dayRecords,
        todayRecord,
        weightLogs,
        activeWorkout,
        workoutTemplates: WORKOUT_TEMPLATES,
        customFoods,
        updateProfile,
        recalculateTargets,
        unitSystem,
        toggleUnitSystem,
        setUnitSystem,
        isOnboardingOpen,
        setIsOnboardingOpen,
        completeOnboarding,
        addFoodItem,
        removeFoodItem,
        updateFoodItem,
        addCustomFood,
        copyYesterdayMeals,
        isWorkoutTemplateModalOpen,
        setIsWorkoutTemplateModalOpen,
        startWorkout,
        updateActiveWorkoutSet,
        addActiveWorkoutExercise,
        removeExerciseFromActiveWorkout,
        addSetToExercise,
        removeSetFromExercise,
        applyAIRecommendationToExercise,
        finishActiveWorkout,
        cancelActiveWorkout,
        deleteWorkout,
        logWeight,
        deleteWeightLog,
        getNutritionalTotalsForDate,
        streakDays,
        milestones,
        getExerciseHistory,
        resetAllData,
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};
