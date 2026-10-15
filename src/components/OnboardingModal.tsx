import React, { useState, useRef } from 'react';
import { useFitness, calculateBMI, calculateAge, computeNutritionTargets } from '../context/FitnessContext';
import { UserProfile, FitnessGoal, ActivityLevel, UnitSystem } from '../types';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
  gramsToOz,
  formatHeight,
} from '../utils/unitConversion';
import {
  Sparkles,
  Camera,
  Upload,
  User,
  Scale,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Flame,
  Award,
  Compass,
} from 'lucide-react';
import { Logo } from './Logo';

interface OnboardingModalProps {
  isOpen: boolean;
}

const PRESET_AVATARS = [
  { id: 'av-1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', label: 'Runner' },
  { id: 'av-2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', label: 'Athlete' },
  { id: 'av-3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', label: 'Fitness' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen }) => {
  const { userProfile, completeOnboarding } = useFitness();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<UserProfile>({
    ...userProfile,
    name: userProfile.name === 'New User' ? '' : userProfile.name,
    nickname: userProfile.nickname || '',
    unitSystem: userProfile.unitSystem || 'metric',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentBMI = calculateBMI(formData.currentWeightKg, formData.heightCm);
  const derivedAge = formData.birthDate ? calculateAge(formData.birthDate) : formData.age;
  const calculatedTargets = computeNutritionTargets(formData);
  const isImperial = formData.unitSystem === 'imperial';

  // Feet & inches
  const { feet, inches } = cmToFeetInches(formData.heightCm);
  const currentWeightLbs = kgToLbs(formData.currentWeightKg, 1);
  const targetWeightLbs = kgToLbs(formData.targetWeightKg, 1);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, avatarUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleHeightImperialChange = (newFeet: number, newInches: number) => {
    const cm = feetInchesToCm(newFeet, newInches);
    setFormData((prev) => ({ ...prev, heightCm: cm }));
  };

  const handleWeightImperialChange = (lbs: number) => {
    const kg = lbsToKg(lbs, 2);
    setFormData((prev) => ({ ...prev, currentWeightKg: kg }));
  };

  const handleTargetWeightImperialChange = (lbs: number) => {
    const kg = lbsToKg(lbs, 2);
    setFormData((prev) => ({ ...prev, targetWeightKg: kg }));
  };

  const handleNext = () => {
    if (step < 4) setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleFinish = () => {
    completeOnboarding({
      ...formData,
      age: derivedAge,
      bmi: currentBMI.bmi,
      bmiCategory: currentBMI.category,
      targetCalories: calculatedTargets.calories,
      targetProtein: calculatedTargets.protein,
      targetCarbs: calculatedTargets.carbs,
      targetFat: calculatedTargets.fat,
      onboarded: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create Your Profile</h2>
              <p className="text-xs text-neutral-400">Step {step} of 4 · Tailoring your AI fitness targets</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  s === step
                    ? 'bg-emerald-500 scale-125'
                    : s < step
                    ? 'bg-emerald-500/50'
                    : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {/* STEP 1: Name, Nickname & Avatar */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">Welcome to MyFitness!</h3>
                <p className="text-xs text-neutral-400">How should we address you and display your journey?</p>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center shadow-lg">
                    {formData.avatarUrl ? (
                      <img
                        src={formData.avatarUrl}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-8 h-8 text-neutral-500" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md"
                    title="Upload photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-neutral-700"
                  >
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                {/* Preset Avatars */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-neutral-500">Or pick:</span>
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: av.url })}
                      className={`w-8 h-8 rounded-xl overflow-hidden border transition-all ${
                        formData.avatarUrl === av.url
                          ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/20'
                          : 'border-neutral-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Nickname / First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Body Metrics & Auto BMI with Unit Choice */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">Your Body Metrics</h3>
                <p className="text-xs text-neutral-400">Used by AI to calculate your exact BMI and calorie expenditure</p>
              </div>

              {/* Unit System Switcher */}
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Measurement System</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {isImperial ? 'lbs & feet/in' : 'kg & cm'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, unitSystem: 'metric' })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      !isImperial
                        ? 'bg-emerald-500 text-neutral-950 font-bold'
                        : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                    }`}
                  >
                    <span>Metric (kg, cm)</span>
                    {!isImperial && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, unitSystem: 'imperial' })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isImperial
                        ? 'bg-emerald-500 text-neutral-950 font-bold'
                        : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                    }`}
                  >
                    <span>Standard (lbs, ft/in)</span>
                    {isImperial && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Date of Birth</span>
                    </label>
                    {formData.birthDate && (
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        {derivedAge} years old
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={formData.birthDate || ''}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Height & Weight Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Height */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Height {isImperial ? '(Feet & Inches)' : '(cm)'}
                  </label>
                  {isImperial ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="3"
                          max="8"
                          value={feet}
                          onChange={(e) =>
                            handleHeightImperialChange(parseInt(e.target.value, 10) || 5, inches)
                          }
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 pr-7"
                        />
                        <span className="absolute right-2 text-xs text-neutral-400 font-semibold pointer-events-none">
                          ft
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="11"
                          value={inches}
                          onChange={(e) =>
                            handleHeightImperialChange(feet, parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 pr-7"
                        />
                        <span className="absolute right-2 text-xs text-neutral-400 font-semibold pointer-events-none">
                          in
                        </span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="100"
                      max="240"
                      value={formData.heightCm}
                      onChange={(e) =>
                        setFormData({ ...formData, heightCm: parseFloat(e.target.value) || 175 })
                      }
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Current Weight {isImperial ? '(lbs)' : '(kg)'}
                  </label>
                  {isImperial ? (
                    <input
                      type="number"
                      step="0.1"
                      min="60"
                      max="660"
                      value={currentWeightLbs}
                      onChange={(e) => handleWeightImperialChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      value={formData.currentWeightKg}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentWeightKg: parseFloat(e.target.value) || 75,
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              </div>

              {/* Real-time BMI Display Card */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>Calculated Body Mass Index (BMI)</span>
                  </div>
                  <span
                    style={{ color: currentBMI.color }}
                    className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                  >
                    {currentBMI.category}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-white">{currentBMI.bmi}</span>
                  <span className="text-xs text-neutral-400">
                    Ideal weight for {formatHeight(formData.heightCm, formData.unitSystem)}:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {isImperial
                        ? `${kgToLbs(currentBMI.healthyWeightMin, 1)}–${kgToLbs(currentBMI.healthyWeightMax, 1)} lbs`
                        : `${currentBMI.healthyWeightMin}–${currentBMI.healthyWeightMax} kg`}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Expanded Goals & Activity */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">Your Fitness Ambition</h3>
                <p className="text-xs text-neutral-400">Select the goal that reflects what you want to achieve</p>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'lose_weight', label: 'Aggressive Fat Loss', desc: 'Accelerated fat drop with high protein to protect lean mass (-500 kcal)', icon: '🔥' },
                  { id: 'mild_fat_loss', label: 'Sustainable Fat Loss', desc: 'Gradual, steady body trimming with comfortable energy (-250 kcal)', icon: '🥗' },
                  { id: 'maintain', label: 'Maintenance & Recomp', desc: 'Keep exact weight while swapping fat for firm muscle tone (0 kcal)', icon: '⚖️' },
                  { id: 'lean_bulk', label: 'Lean Muscle Hypertrophy', desc: 'Controlled caloric surplus for muscular size without unwanted fat (+250 kcal)', icon: '💪' },
                  { id: 'aggressive_bulk', label: 'Maximum Mass Bulking', desc: 'High energy surplus for rapid size, strength & powerlifting (+450 kcal)', icon: '🦍' },
                  { id: 'strength_power', label: 'Athletic Strength & Power', desc: 'Peak explosive power & neural strength adaptation (+150 kcal)', icon: '⚡' },
                  { id: 'endurance', label: 'Cardio & Stamina', desc: 'High carbohydrate availability for distance running & endurance (+200 kcal)', icon: '🏃' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, goal: g.id as FitnessGoal })}
                    className={`w-full p-3 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                      formData.goal === g.id
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md'
                        : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{g.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{g.label}</span>
                        {formData.goal === g.id && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Activity Level */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-neutral-300">Weekly Activity Level</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e: any) => setFormData({ ...formData, activityLevel: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="sedentary">Sedentary (desk job, minimal workouts)</option>
                  <option value="light">Lightly Active (gym 1–3 sessions/week)</option>
                  <option value="moderate">Moderately Active (training 3–5 days/week)</option>
                  <option value="very_active">Very Active (intense training 6–7 days/week)</option>
                  <option value="extra_active">Extremely Active (competitive athlete / physical job)</option>
                </select>
              </div>

              {/* Target Weight */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">
                    Target Goal Weight {isImperial ? '(lbs)' : '(kg)'}
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {isImperial ? `${formData.targetWeightKg.toFixed(1)} kg` : `${targetWeightLbs} lbs`}
                  </span>
                </div>

                {isImperial ? (
                  <input
                    type="number"
                    step="0.5"
                    min="60"
                    max="660"
                    value={targetWeightLbs}
                    onChange={(e) => handleTargetWeightImperialChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <input
                    type="number"
                    step="0.5"
                    min="30"
                    max="300"
                    value={formData.targetWeightKg}
                    onChange={(e) =>
                      setFormData({ ...formData, targetWeightKg: parseFloat(e.target.value) || 70 })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 4: AI Strategy Confirmation */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Your AI Fitness Plan is Ready!</h3>
                <p className="text-xs text-neutral-400">Calculated with scientific precision for {formData.nickname || formData.name || 'you'}</p>
              </div>

              {/* Target Calories Big Dial */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-950 to-emerald-950/30 border border-emerald-500/30 text-center space-y-1 shadow-lg">
                <div className="text-xs uppercase font-bold tracking-wider text-neutral-400">Daily Calorie Target</div>
                <div className="text-3xl font-black font-mono text-emerald-400">{calculatedTargets.calories} kcal</div>
                <div className="text-[11px] text-neutral-400">Fueling your {formData.goal.replace(/_/g, ' ')} transformation</div>
              </div>

              {/* Macro breakdown */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="text-[10px] uppercase font-bold text-sky-400">Protein</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    {isImperial
                      ? `${gramsToOz(calculatedTargets.protein, 1)} oz`
                      : `${calculatedTargets.protein}g`}
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono">
                    {isImperial ? `${calculatedTargets.protein}g` : `${gramsToOz(calculatedTargets.protein, 1)} oz`}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Carbs</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    {isImperial
                      ? `${gramsToOz(calculatedTargets.carbs, 1)} oz`
                      : `${calculatedTargets.carbs}g`}
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono">
                    {isImperial ? `${calculatedTargets.carbs}g` : `${gramsToOz(calculatedTargets.carbs, 1)} oz`}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="text-[10px] uppercase font-bold text-rose-400">Fats</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    {isImperial
                      ? `${gramsToOz(calculatedTargets.fat, 1)} oz`
                      : `${calculatedTargets.fat}g`}
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono">
                    {isImperial ? `${calculatedTargets.fat}g` : `${gramsToOz(calculatedTargets.fat, 1)} oz`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Start My Journey</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
