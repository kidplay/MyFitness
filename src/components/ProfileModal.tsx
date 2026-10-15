import React, { useState, useRef, useEffect } from 'react';
import {
  useFitness,
  computeNutritionTargets,
  calculateBMI,
  calculateAge,
} from '../context/FitnessContext';
import { UserProfile, ActivityLevel, FitnessGoal, UnitSystem } from '../types';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
  gramsToOz,
  formatHeight,
} from '../utils/unitConversion';
import {
  X,
  User,
  Sliders,
  RotateCcw,
  Check,
  Target,
  Sparkles,
  Camera,
  Upload,
  Trash2,
  Scale,
  Calendar,
  Info,
  Compass,
  Home,
} from 'lucide-react';
import { Logo } from './Logo';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  {
    id: 'av-1',
    label: 'Runner',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'av-2',
    label: 'Athlete',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'av-3',
    label: 'Fitness',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateProfile, resetAllData } = useFitness();

  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync internal state when opened or userProfile changes
  useEffect(() => {
    if (isOpen) {
      setFormData(userProfile);
      setShowResetConfirm(false);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const currentBMI = calculateBMI(formData.currentWeightKg, formData.heightCm);
  const derivedAge = formData.birthDate ? calculateAge(formData.birthDate) : formData.age;
  const isImperial = formData.unitSystem === 'imperial';

  // Feet and inches derivation
  const { feet, inches } = cmToFeetInches(formData.heightCm);

  // Lbs derivation
  const currentWeightLbs = kgToLbs(formData.currentWeightKg, 1);
  const targetWeightLbs = kgToLbs(formData.targetWeightKg, 1);

  const handleUnitSystemChange = (system: UnitSystem) => {
    setFormData((prev) => ({ ...prev, unitSystem: system }));
  };

  const handleMetricChange = (field: keyof UserProfile, value: any) => {
    let updated = { ...formData, [field]: value };

    // Auto-sync age when birthDate changes
    if (field === 'birthDate') {
      const newAge = calculateAge(value);
      updated.age = newAge;
    }

    // Auto-calculate BMI
    const bmiData = calculateBMI(
      field === 'currentWeightKg' ? value : updated.currentWeightKg,
      field === 'heightCm' ? value : updated.heightCm
    );
    updated.bmi = bmiData.bmi;
    updated.bmiCategory = bmiData.category;

    if (!manualOverride) {
      const calculated = computeNutritionTargets(updated);
      updated.targetCalories = calculated.calories;
      updated.targetProtein = calculated.protein;
      updated.targetCarbs = calculated.carbs;
      updated.targetFat = calculated.fat;
    }
    setFormData(updated);
  };

  const handleHeightImperialChange = (newFeet: number, newInches: number) => {
    const cm = feetInchesToCm(newFeet, newInches);
    handleMetricChange('heightCm', cm);
  };

  const handleWeightImperialChange = (lbs: number) => {
    const kg = lbsToKg(lbs, 2);
    handleMetricChange('currentWeightKg', kg);
  };

  const handleTargetWeightImperialChange = (lbs: number) => {
    const kg = lbsToKg(lbs, 2);
    handleMetricChange('targetWeightKg', kg);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({ ...prev, avatarUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    onClose();
  };

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
    onClose();
  };

  // BMI Position Indicator percentage (Scale 15 to 35)
  const bmiPct = Math.min(100, Math.max(0, ((currentBMI.bmi - 15) / (35 - 15)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">User Profile & Metrics</h2>
              <p className="text-xs text-neutral-400">Configure your body stats, units, and nutrition targets</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700 transition-all group"
              title="Cancel and return to Today's screen"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* MEASUREMENT SYSTEM SELECTOR (Metric vs Standard / Imperial) */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Measurement Units</span>
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                {isImperial ? 'lbs, ft/in, oz, fl oz' : 'kg, cm, g, ml'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleUnitSystemChange('metric')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  !isImperial
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-850 border border-neutral-800'
                }`}
              >
                <span>Metric (kg, cm, g)</span>
                {!isImperial && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <button
                type="button"
                onClick={() => handleUnitSystemChange('imperial')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isImperial
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-850 border border-neutral-800'
                }`}
              >
                <span>Standard (lbs, ft, oz)</span>
                {isImperial && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </div>
          </div>

          {/* Profile Photo / Avatar Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Profile Picture</label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center shadow-md">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {!formData.avatarUrl && (
                    <span className="text-xl font-bold text-emerald-400">
                      {(formData.nickname || formData.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md"
                  title="Upload from device"
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

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-neutral-700"
                  >
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span>Upload Photo</span>
                  </button>

                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="p-1.5 text-neutral-500 hover:text-rose-400"
                      title="Remove custom photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Preset Avatars */}
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-[10px] text-neutral-500">Presets:</span>
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: av.url }))}
                      className={`w-7 h-7 rounded-lg overflow-hidden border transition-all ${
                        formData.avatarUrl === av.url
                          ? 'border-emerald-400 scale-105'
                          : 'border-neutral-700 opacity-60 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      <img
                        src={av.url}
                        alt={av.label}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Name & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleMetricChange('name', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Nickname / Display Name</label>
              <input
                type="text"
                placeholder="e.g. Alex, Champ"
                value={formData.nickname || ''}
                onChange={(e) => handleMetricChange('nickname', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Date of Birth</span>
                </label>
                {formData.birthDate && (
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    {derivedAge} years old
                  </span>
                )}
              </div>
              <input
                type="date"
                value={formData.birthDate || ''}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleMetricChange('birthDate', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Gender</label>
              <select
                value={formData.gender}
                onChange={(e: any) => handleMetricChange('gender', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Height & Weight Inputs (Adapts dynamically to Metric vs Standard) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Height input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">
                  Height {isImperial ? '(Feet & Inches)' : '(cm)'}
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {isImperial ? `${Math.round(formData.heightCm)} cm` : `${feet}'${inches}"`}
                </span>
              </div>

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
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 pr-8"
                    />
                    <span className="absolute right-2.5 text-xs text-neutral-400 font-semibold pointer-events-none">
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
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 pr-8"
                    />
                    <span className="absolute right-2.5 text-xs text-neutral-400 font-semibold pointer-events-none">
                      in
                    </span>
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={formData.heightCm}
                  onChange={(e) =>
                    handleMetricChange('heightCm', parseFloat(e.target.value) || 175)
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>

            {/* Current Weight input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">
                  Current Weight {isImperial ? '(lbs)' : '(kg)'}
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {isImperial ? `${formData.currentWeightKg.toFixed(1)} kg` : `${currentWeightLbs} lbs`}
                </span>
              </div>

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
                    handleMetricChange('currentWeightKg', parseFloat(e.target.value) || 75)
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>
          </div>

          {/* AI AUTO-CALCULATED BMI CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-950 to-emerald-950/20 border border-neutral-800 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Body Mass Index (BMI)
                </span>
              </div>
              <span
                style={{ color: currentBMI.color }}
                className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800"
              >
                {currentBMI.category}
              </span>
            </div>

            {/* BMI Number & Formula */}
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {currentBMI.bmi}
              </div>
              <div className="text-xs text-neutral-400">
                {isImperial
                  ? 'BMI = 703 × weight (lbs) / [height (in)]²'
                  : 'BMI = weight (kg) / [height (m)]²'}
              </div>
            </div>

            {/* Visual Range Spectrum Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="relative w-full h-3 rounded-full bg-neutral-800 flex overflow-hidden p-0.5 border border-neutral-700/60">
                <div style={{ width: '17.5%' }} className="h-full bg-sky-500 rounded-l-full" title="Underweight (<18.5)" />
                <div style={{ width: '32%' }} className="h-full bg-emerald-500" title="Normal weight (18.5 - 24.9)" />
                <div style={{ width: '25%' }} className="h-full bg-amber-500" title="Overweight (25.0 - 29.9)" />
                <div style={{ width: '25.5%' }} className="h-full bg-rose-500 rounded-r-full" title="Obesity (30.0+)" />
              </div>

              {/* Cursor indicator */}
              <div className="relative w-full h-2">
                <div
                  style={{ left: `${bmiPct}%` }}
                  className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center"
                >
                  <div className="w-2.5 h-2.5 bg-white rounded-full shadow-md border-2 border-neutral-950" />
                </div>
              </div>

              {/* BMI Scale Tick Labels */}
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono px-1">
                <span>15</span>
                <span>18.5 (Under)</span>
                <span>25.0 (Normal)</span>
                <span>30.0 (Over)</span>
                <span>35+</span>
              </div>
            </div>

            {/* Optimal Weight Range Info */}
            <div className="text-xs text-neutral-300 pt-1 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Healthy weight range for {formatHeight(formData.heightCm, formData.unitSystem)}:{' '}
                <strong className="text-emerald-400 font-mono">
                  {isImperial
                    ? `${kgToLbs(currentBMI.healthyWeightMin, 1)} lbs – ${kgToLbs(currentBMI.healthyWeightMax, 1)} lbs`
                    : `${currentBMI.healthyWeightMin} kg – ${currentBMI.healthyWeightMax} kg`}
                </strong>{' '}
                {formData.currentWeightKg >= currentBMI.healthyWeightMin &&
                formData.currentWeightKg <= currentBMI.healthyWeightMax
                  ? '· You are currently in the healthy zone!'
                  : ''}
              </span>
            </div>
          </div>

          {/* Activity Level & Fitness Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Activity Level</label>
              <select
                value={formData.activityLevel}
                onChange={(e: any) => handleMetricChange('activityLevel', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="sedentary">Sedentary (desk job, light walking)</option>
                <option value="light">Lightly Active (exercise 1–3 days/wk)</option>
                <option value="moderate">Moderately Active (training 3–5 days/wk)</option>
                <option value="very_active">Very Active (heavy training 6–7 days/wk)</option>
                <option value="extra_active">Extremely Active (athlete/manual labor)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Primary Goal</label>
              <select
                value={formData.goal}
                onChange={(e: any) => handleMetricChange('goal', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="lose_weight">Aggressive Fat Loss (-500 kcal)</option>
                <option value="mild_fat_loss">Sustainable Fat Loss (-250 kcal)</option>
                <option value="maintain">Maintenance & Recomp (0 kcal)</option>
                <option value="lean_bulk">Lean Muscle Hypertrophy (+250 kcal)</option>
                <option value="aggressive_bulk">Maximum Mass Bulking (+450 kcal)</option>
                <option value="strength_power">Athletic Strength & Power (+150 kcal)</option>
                <option value="endurance">Cardiovascular Endurance (+200 kcal)</option>
              </select>
            </div>
          </div>

          {/* Target Goal Weight */}
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
                  handleMetricChange('targetWeightKg', parseFloat(e.target.value) || 70)
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* Daily Calorie & Macro Targets Card */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Daily Calculated Targets</span>
              </div>
              <button
                type="button"
                onClick={() => setManualOverride(!manualOverride)}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                {manualOverride ? 'Auto Calculate' : 'Manual Override'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Calories</div>
                {manualOverride ? (
                  <input
                    type="number"
                    value={formData.targetCalories}
                    onChange={(e) =>
                      setFormData({ ...formData, targetCalories: parseInt(e.target.value, 10) || 2000 })
                    }
                    className="w-full bg-transparent text-emerald-400 font-bold font-mono text-center text-sm"
                  />
                ) : (
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    {formData.targetCalories}
                  </div>
                )}
                <div className="text-[9px] text-neutral-500">kcal</div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] uppercase font-bold text-sky-400">Protein</div>
                {manualOverride ? (
                  <input
                    type="number"
                    value={formData.targetProtein}
                    onChange={(e) =>
                      setFormData({ ...formData, targetProtein: parseInt(e.target.value, 10) || 150 })
                    }
                    className="w-full bg-transparent text-sky-300 font-bold font-mono text-center text-sm"
                  />
                ) : (
                  <div className="text-sm font-bold text-sky-300 font-mono mt-0.5">
                    {isImperial ? `${gramsToOz(formData.targetProtein, 1)} oz` : `${formData.targetProtein}g`}
                  </div>
                )}
                <div className="text-[9px] text-neutral-500 font-mono">
                  {isImperial ? `${formData.targetProtein}g` : `${gramsToOz(formData.targetProtein, 1)} oz`}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] uppercase font-bold text-amber-400">Carbs</div>
                {manualOverride ? (
                  <input
                    type="number"
                    value={formData.targetCarbs}
                    onChange={(e) =>
                      setFormData({ ...formData, targetCarbs: parseInt(e.target.value, 10) || 200 })
                    }
                    className="w-full bg-transparent text-amber-300 font-bold font-mono text-center text-sm"
                  />
                ) : (
                  <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                    {isImperial ? `${gramsToOz(formData.targetCarbs, 1)} oz` : `${formData.targetCarbs}g`}
                  </div>
                )}
                <div className="text-[9px] text-neutral-500 font-mono">
                  {isImperial ? `${formData.targetCarbs}g` : `${gramsToOz(formData.targetCarbs, 1)} oz`}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] uppercase font-bold text-rose-400">Fat</div>
                {manualOverride ? (
                  <input
                    type="number"
                    value={formData.targetFat}
                    onChange={(e) =>
                      setFormData({ ...formData, targetFat: parseInt(e.target.value, 10) || 60 })
                    }
                    className="w-full bg-transparent text-rose-300 font-bold font-mono text-center text-sm"
                  />
                ) : (
                  <div className="text-sm font-bold text-rose-300 font-mono mt-0.5">
                    {isImperial ? `${gramsToOz(formData.targetFat, 1)} oz` : `${formData.targetFat}g`}
                  </div>
                )}
                <div className="text-[9px] text-neutral-500 font-mono">
                  {isImperial ? `${formData.targetFat}g` : `${gramsToOz(formData.targetFat, 1)} oz`}
                </div>
              </div>
            </div>
          </div>

          {/* Reset App State */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Reset demo data & clear logs</span>
            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-400"
                >
                  Confirm Reset
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1 text-rose-400 hover:underline font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Profile & Targets</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
