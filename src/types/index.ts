export type UnitSystem = 'metric' | 'imperial';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'very_active'
  | 'extra_active';

export type FitnessGoal =
  | 'lose_weight'       // Aggressive Fat Loss (-500 kcal)
  | 'mild_fat_loss'     // Sustainable Fat Loss (-250 kcal)
  | 'maintain'          // Maintenance & Body Recomp (0 kcal)
  | 'lean_bulk'         // Lean Muscle Gain (+250 kcal)
  | 'aggressive_bulk'   // Hypertrophy & Bulking (+450 kcal)
  | 'strength_power'    // Peak Strength & Athletic Performance (+150 kcal, high protein)
  | 'endurance';        // Endurance & Cardiovascular Stamina (+200 kcal, higher carb ratio)

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface UserProfile {
  name: string;
  nickname?: string;
  avatarUrl?: string;
  birthDate?: string; // YYYY-MM-DD
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  bmi?: number;
  bmiCategory?: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  unitSystem: UnitSystem;
  onboarded?: boolean;
}

export interface RecognizedFoodItem {
  id?: string;
  name: string;
  category?: 'Proteins' | 'Carbohydrates' | 'Vegetables & Fruits' | 'Healthy Fats & Oils' | 'Dairy & Dressings' | 'Beverages' | 'Snacks & Sweets' | string;
  preparation?: string;
  portionDescription: string;
  weightGrams?: number;
  weightOz?: number;
  householdMeasure?: string;
  handReference?: string;
  visualCues?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  servingDescription: string;
  servingMultiplier: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
  category?: string;
  aiScanned?: boolean;
  aiCalculated?: boolean;
  healthInsight?: string;
  photoUrl?: string;
  containerDetected?: string;
  ingredients?: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  recognizedItems?: RecognizedFoodItem[];
}

export interface ExerciseSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface AIExerciseRecommendation {
  suggestedWeightKg: number;
  suggestedReps: number;
  reason: string;
  type: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
  badge: string;
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  category: 'strength' | 'cardio' | 'bodyweight';
  sets: ExerciseSet[];
  notes?: string;
  aiRecommendation?: AIExerciseRecommendation;
}

export interface Workout {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  caloriesBurned: number;
  exercises: Exercise[];
  completed: boolean;
  category?: string;
  notes?: string;
}

export type ExerciseMuscleGroup =
  | 'Chest'
  | 'Triceps'
  | 'Back'
  | 'Biceps'
  | 'Shoulders'
  | 'Legs & Glutes'
  | 'Core & Abs'
  | 'Full Body & HIIT'
  | 'Cardio & Endurance';

export type ExerciseEquipment =
  | 'Dumbbell'
  | 'Barbell / EZ-Bar'
  | 'Cable / Machine'
  | 'Bodyweight'
  | 'Kettlebell / Specialty'
  | 'Cardio';

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  aliases?: string[];
  targetMuscle: string;
  muscleGroup: ExerciseMuscleGroup;
  equipment: ExerciseEquipment;
  category: 'strength' | 'cardio' | 'bodyweight';
  defaultSets: number;
  defaultReps: number;
  defaultWeightKg: number;
  recommendedGoals: FitnessGoal[];
  formCue: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: string;
  focusArea?: string;
  recommendedGoals?: FitnessGoal[];
  estimatedMinutes: number;
  estimatedCalories: number;
  description: string;
  exercises: Array<{
    name: string;
    targetMuscle: string;
    defaultSets: number;
    defaultReps: number;
    defaultWeightKg: number;
    category: 'strength' | 'cardio' | 'bodyweight';
  }>;
}

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  meals: {
    breakfast: FoodItem[];
    lunch: FoodItem[];
    dinner: FoodItem[];
    snacks: FoodItem[];
  };
  workouts: Workout[];
}

export interface FoodDatabaseItem {
  id: string;
  name: string;
  category: 'Proteins' | 'Carbohydrates' | 'Fats & Dairy' | 'Produce' | 'Snacks';
  servingDescription: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Milestone {
  id: string;
  title: string;
  category: 'weight' | 'streak' | 'workout' | 'nutrition';
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: boolean;
  unlockedAt?: string;
  rewardIcon: string;
  description: string;
}
