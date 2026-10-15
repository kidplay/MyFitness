import React, { useState, useMemo, useEffect } from 'react';
import { MealType, FoodDatabaseItem } from '../types';
import { COMMON_FOOD_DATABASE } from '../data/initialData';
import { useFitness } from '../context/FitnessContext';
import { formatMacro } from '../utils/unitConversion';
import {
  Search,
  Plus,
  X,
  Check,
  Zap,
  BookOpen,
  Sparkles,
  Loader2,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Flame,
  Info,
  Home,
} from 'lucide-react';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType: MealType;
  initialTab?: 'ai' | 'search' | 'quick' | 'custom';
}

interface CalculatedAiNutrition {
  foodName: string;
  servingSize: string;
  category: 'Proteins' | 'Carbohydrates' | 'Fats & Dairy' | 'Produce' | 'Snacks';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  summary: string;
  ingredients?: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  isFallback?: boolean;
}

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  isOpen,
  onClose,
  defaultMealType,
  initialTab = 'ai',
}) => {
  const { addFoodItem, customFoods, addCustomFood, unitSystem, userProfile } = useFitness();

  const [activeTab, setActiveTab] = useState<'ai' | 'search' | 'quick' | 'custom'>(initialTab);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Sync props when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedMealType(defaultMealType);
      setActiveTab(initialTab);
    }
  }, [isOpen, defaultMealType, initialTab]);

  // AI Meal Log State
  const [aiFoodName, setAiFoodName] = useState('');
  const [aiServingSize, setAiServingSize] = useState('1 standard plate (~350g)');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<CalculatedAiNutrition | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);
  const [isFineTuning, setIsFineTuning] = useState(false);
  const [customCalories, setCustomCalories] = useState<string>('');
  const [customProtein, setCustomProtein] = useState<string>('');
  const [customCarbs, setCustomCarbs] = useState<string>('');
  const [customFat, setCustomFat] = useState<string>('');
  const [saveToCustomFoods, setSaveToCustomFoods] = useState(false);
  const [showIngredients, setShowIngredients] = useState(true);
  const [logSuccess, setLogSuccess] = useState(false);

  // Quick preset serving suggestions
  const servingPresets = useMemo(() => {
    if (unitSystem === 'imperial') {
      return ['4 oz portion', '6 oz portion', '8 oz portion', '1 cup (~8 fl oz)', '1 standard bowl', '1 full plate'];
    }
    return ['100g portion', '150g portion', '200g portion', '300g portion', '1 standard bowl', '1 full plate'];
  }, [unitSystem]);

  // Meal example chips for quick testing
  const mealSuggestions = [
    { name: 'Grilled Chicken Breast, Brown Rice & Broccoli', portion: '1 plate (~380g)' },
    { name: '3 Scrambled Eggs with Avocado Sourdough Toast', portion: '2 slices toast, 3 eggs' },
    { name: 'Salmon Fillet with Quinoa & Asparagus', portion: '1 fillet (~180g) + 1 cup quinoa' },
    { name: 'Whey Protein Smoothie with Banana & Peanut Butter', portion: '1 tall glass (450ml)' },
    { name: 'Greek Yogurt Bowl with Berries, Chia Seeds & Honey', portion: '1 bowl (~250g)' },
  ];

  // Selected item from database search
  const [selectedItem, setSelectedItem] = useState<FoodDatabaseItem | null>(null);
  const [dbMultiplier, setDbMultiplier] = useState<number>(1);

  // Quick calorie add state
  const [quickName, setQuickName] = useState('');
  const [quickCalories, setQuickCalories] = useState<string>('250');
  const [quickProtein, setQuickProtein] = useState<string>('20');
  const [quickCarbs, setQuickCarbs] = useState<string>('25');
  const [quickFat, setQuickFat] = useState<string>('8');
  const [quickAiLoading, setQuickAiLoading] = useState(false);

  // Custom food creator state
  const [customName, setCustomName] = useState('');
  const [customServing, setCustomServing] = useState('100g');
  const [customCals, setCustomCals] = useState('');
  const [customP, setCustomP] = useState('');
  const [customC, setCustomC] = useState('');
  const [customF, setCustomF] = useState('');
  const [customCat, setCustomCat] = useState<'Proteins' | 'Carbohydrates' | 'Fats & Dairy' | 'Produce' | 'Snacks'>('Proteins');
  const [customAiLoading, setCustomAiLoading] = useState(false);

  const categories = ['All', 'Proteins', 'Carbohydrates', 'Fats & Dairy', 'Produce', 'Snacks'];

  const allFoods = useMemo(() => {
    return [...customFoods, ...COMMON_FOOD_DATABASE];
  }, [customFoods]);

  const filteredFoods = useMemo(() => {
    return allFoods.filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allFoods, searchQuery, selectedCategory]);

  // AI Calculation trigger
  const handleCalculateWithAi = async (nameOverride?: string, portionOverride?: string) => {
    const targetName = (nameOverride !== undefined ? nameOverride : aiFoodName).trim();
    const targetPortion = (portionOverride !== undefined ? portionOverride : aiServingSize).trim() || '1 serving';

    if (!targetName) {
      setCalcError('Please enter a meal or food description first.');
      return;
    }

    setCalcError(null);
    setIsCalculating(true);

    try {
      const res = await fetch('/api/food/calculate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: targetName,
          servingSize: targetPortion,
          unitSystem,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: CalculatedAiNutrition = await res.json();
      setAiResult(data);
      setServingMultiplier(1);
      setIsFineTuning(false);
      setCustomCalories(String(data.calories));
      setCustomProtein(String(data.protein));
      setCustomCarbs(String(data.carbs));
      setCustomFat(String(data.fat));
    } catch (err: any) {
      console.error('AI nutrition calculation failed:', err);
      setCalcError('Unable to connect to AI server. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Quick Add Auto-fill with AI
  const handleQuickAddAiFill = async () => {
    if (!quickName.trim()) return;
    setQuickAiLoading(true);
    try {
      const res = await fetch('/api/food/calculate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: quickName.trim(),
          servingSize: '1 serving',
          unitSystem,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuickCalories(String(data.calories));
        setQuickProtein(String(data.protein));
        setQuickCarbs(String(data.carbs));
        setQuickFat(String(data.fat));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQuickAiLoading(false);
    }
  };

  // Custom Food Auto-estimate with AI
  const handleCustomFoodAiEstimate = async () => {
    if (!customName.trim()) return;
    setCustomAiLoading(true);
    try {
      const res = await fetch('/api/food/calculate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: customName.trim(),
          servingSize: customServing.trim() || '1 serving',
          unitSystem,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomCals(String(data.calories));
        setCustomP(String(data.protein));
        setCustomC(String(data.carbs));
        setCustomF(String(data.fat));
        if (data.category) setCustomCat(data.category);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCustomAiLoading(false);
    }
  };

  // Handle logging AI meal
  const handleLogAiMeal = () => {
    if (!aiResult) return;

    const mult = servingMultiplier || 1;
    const finalCals = isFineTuning
      ? parseInt(customCalories, 10) || Math.round(aiResult.calories * mult)
      : Math.round(aiResult.calories * mult);
    const finalProtein = isFineTuning
      ? parseInt(customProtein, 10) || Math.round(aiResult.protein * mult)
      : Math.round(aiResult.protein * mult);
    const finalCarbs = isFineTuning
      ? parseInt(customCarbs, 10) || Math.round(aiResult.carbs * mult)
      : Math.round(aiResult.carbs * mult);
    const finalFat = isFineTuning
      ? parseInt(customFat, 10) || Math.round(aiResult.fat * mult)
      : Math.round(aiResult.fat * mult);

    addFoodItem(selectedMealType, {
      name: aiResult.foodName || aiFoodName.trim(),
      servingDescription: aiResult.servingSize || aiServingSize.trim() || '1 serving',
      servingMultiplier: mult,
      calories: finalCals,
      protein: finalProtein,
      carbs: finalCarbs,
      fat: finalFat,
      category: aiResult.category || 'Proteins',
      aiCalculated: true,
      healthInsight: aiResult.summary,
      ingredients: aiResult.ingredients?.map((ing) => ({
        name: ing.name,
        portion: ing.portion,
        calories: Math.round(ing.calories * mult),
        protein: Math.round(ing.protein * mult),
        carbs: Math.round(ing.carbs * mult),
        fat: Math.round(ing.fat * mult),
      })),
    });

    if (saveToCustomFoods) {
      addCustomFood({
        name: aiResult.foodName || aiFoodName.trim(),
        servingDescription: aiResult.servingSize || '1 serving',
        category: aiResult.category || 'Proteins',
        calories: finalCals,
        protein: finalProtein,
        carbs: finalCarbs,
        fat: finalFat,
      });
    }

    setLogSuccess(true);
    setTimeout(() => {
      setLogSuccess(false);
      onClose();
    }, 450);
  };

  const handleSelectItem = (item: FoodDatabaseItem) => {
    setSelectedItem(item);
    setDbMultiplier(1);
  };

  const handleAddSelectedItem = () => {
    if (!selectedItem) return;
    addFoodItem(selectedMealType, {
      name: selectedItem.name,
      servingDescription: selectedItem.servingDescription,
      servingMultiplier: dbMultiplier,
      calories: selectedItem.calories,
      protein: selectedItem.protein,
      carbs: selectedItem.carbs,
      fat: selectedItem.fat,
      category: selectedItem.category,
    });
    setSelectedItem(null);
    onClose();
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cals = parseInt(quickCalories, 10);
    if (!cals || isNaN(cals)) return;

    addFoodItem(selectedMealType, {
      name: quickName.trim() || 'Quick Logged Food',
      servingDescription: '1 portion',
      servingMultiplier: 1,
      calories: cals,
      protein: parseInt(quickProtein, 10) || 0,
      carbs: parseInt(quickCarbs, 10) || 0,
      fat: parseInt(quickFat, 10) || 0,
      category: 'Quick Add',
    });
    onClose();
  };

  const handleSaveCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customCals) return;

    const newFood: Omit<FoodDatabaseItem, 'id'> = {
      name: customName.trim(),
      servingDescription: customServing.trim() || '1 serving',
      category: customCat,
      calories: parseInt(customCals, 10) || 0,
      protein: parseInt(customP, 10) || 0,
      carbs: parseInt(customC, 10) || 0,
      fat: parseInt(customF, 10) || 0,
    };

    addCustomFood(newFood);
    addFoodItem(selectedMealType, {
      ...newFood,
      servingMultiplier: 1,
    });

    onClose();
  };

  if (!isOpen) return null;

  // Active calculated values taking multiplier or fine tuning into account
  const currentMult = servingMultiplier || 1;
  const activeCalories = aiResult
    ? isFineTuning
      ? parseInt(customCalories, 10) || 0
      : Math.round(aiResult.calories * currentMult)
    : 0;
  const activeProtein = aiResult
    ? isFineTuning
      ? parseInt(customProtein, 10) || 0
      : Math.round(aiResult.protein * currentMult)
    : 0;
  const activeCarbs = aiResult
    ? isFineTuning
      ? parseInt(customCarbs, 10) || 0
      : Math.round(aiResult.carbs * currentMult)
    : 0;
  const activeFat = aiResult
    ? isFineTuning
      ? parseInt(customFat, 10) || 0
      : Math.round(aiResult.fat * currentMult)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Log Meal to <span className="capitalize text-emerald-400 font-extrabold">{selectedMealType}</span>
            </h2>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {(
                [
                  { type: 'breakfast', label: 'Breakfast', icon: '🍳' },
                  { type: 'lunch', label: 'Lunch', icon: '🥗' },
                  { type: 'dinner', label: 'Dinner', icon: '🍽️' },
                  { type: 'snacks', label: 'Snacks', icon: '🍎' },
                ] as const
              ).map((m) => (
                <button
                  key={m.type}
                  onClick={() => setSelectedMealType(m.type)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    selectedMealType === m.type
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950/40 border border-neutral-800/80'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 px-3 sm:px-4 bg-neutral-950/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('ai');
              setSelectedItem(null);
            }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Smart Meal Log</span>
            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300">
              AI
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('search');
              setSelectedItem(null);
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'search'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Food Database</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('quick');
              setSelectedItem(null);
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quick'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Calorie</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('custom');
              setSelectedItem(null);
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'custom'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Food</span>
          </button>
        </div>

        {/* Tab 0: AI Smart Meal Log (Manual + AI Nutrition Calculation based on Serving Size) */}
        {activeTab === 'ai' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Input card */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3.5 shadow-sm">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <span>What did you eat or drink?</span>
                    <span className="text-[10px] text-emerald-400 font-normal">
                      (Type meal or multiple ingredients)
                    </span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={aiFoodName}
                    onChange={(e) => setAiFoodName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCalculateWithAi();
                      }
                    }}
                    placeholder="e.g. Grilled salmon, brown rice & steamed asparagus"
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                  {aiFoodName && (
                    <button
                      onClick={() => setAiFoodName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Serving Size Input & Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-200">
                    Serving Size / Portion
                  </label>
                  <span className="text-[11px] text-neutral-400 capitalize">
                    Units: <strong className="text-emerald-400">{unitSystem}</strong>
                  </span>
                </div>
                <input
                  type="text"
                  value={aiServingSize}
                  onChange={(e) => setAiServingSize(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCalculateWithAi();
                    }
                  }}
                  placeholder="e.g. 1 bowl (~350g), 200g, 8 oz, 2 slices"
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />

                {/* Preset Portion Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap font-medium">Quick portions:</span>
                  {servingPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAiServingSize(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border whitespace-nowrap transition-colors ${
                        aiServingSize === preset
                          ? 'bg-neutral-800 text-emerald-400 border-emerald-500/40'
                          : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error notice */}
              {calcError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
                  {calcError}
                </div>
              )}

              {/* Calculate Button */}
              <button
                type="button"
                disabled={isCalculating || !aiFoodName.trim()}
                onClick={() => handleCalculateWithAi()}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  isCalculating || !aiFoodName.trim()
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20 active:scale-[0.99]'
                }`}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>Calculating Calories & Nutritional Values with AI...</span>
                  </>
                ) : aiResult ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recalculate with AI for this Portion</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Calculate Nutrition with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Meal Suggestion Chips if no result yet */}
            {!aiResult && !isCalculating && (
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Try popular fitness meals:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mealSuggestions.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiFoodName(m.name);
                        setAiServingSize(m.portion);
                        handleCalculateWithAi(m.name, m.portion);
                      }}
                      className="text-left p-2.5 rounded-xl bg-neutral-950/40 border border-neutral-800/80 hover:border-emerald-500/40 hover:bg-neutral-800/40 transition-all text-xs group"
                    >
                      <div className="font-semibold text-neutral-200 group-hover:text-white truncate">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-neutral-400">Portion: {m.portion}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {isCalculating && (
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-neutral-800 rounded w-1/3" />
                  <div className="h-4 bg-neutral-800 rounded w-1/6" />
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="h-12 bg-neutral-800 rounded-xl" />
                  <div className="h-12 bg-neutral-800 rounded-xl" />
                  <div className="h-12 bg-neutral-800 rounded-xl" />
                  <div className="h-12 bg-neutral-800 rounded-xl" />
                </div>
                <div className="h-8 bg-neutral-800 rounded-xl" />
              </div>
            )}

            {/* Calculation Result Display */}
            {aiResult && !isCalculating && (
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-emerald-500/30 space-y-4 shadow-xl">
                {/* Result Title & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {aiResult.foodName}
                    </h3>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2 pt-0.5">
                      <span>Serving: <strong className="text-neutral-200">{aiResult.servingSize}</strong></span>
                      <span>·</span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                        {aiResult.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-center">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {Math.round((aiResult.confidence || 0.94) * 100)}% Match
                    </span>
                    <button
                      onClick={() => setIsFineTuning(!isFineTuning)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors flex items-center gap-1 ${
                        isFineTuning
                          ? 'bg-neutral-800 text-white border-neutral-600'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                      }`}
                      title="Fine-tune calories or macros"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{isFineTuning ? 'Auto Scaling' : 'Edit Numbers'}</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Serving Multiplier Bar */}
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-300">Portion Scale:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {servingMultiplier}x
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      ({Math.round(currentMult * 100)}% of original portion)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setServingMultiplier(s);
                          if (isFineTuning) {
                            setCustomCalories(String(Math.round(aiResult.calories * s)));
                            setCustomProtein(String(Math.round(aiResult.protein * s)));
                            setCustomCarbs(String(Math.round(aiResult.carbs * s)));
                            setCustomFat(String(Math.round(aiResult.fat * s)));
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                          servingMultiplier === s
                            ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                            : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Macro values grid */}
                {!isFineTuning ? (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {/* Calories */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                      <div className="text-[10px] font-semibold text-neutral-400">Calories</div>
                      <div className="text-lg font-mono font-extrabold text-emerald-400">
                        {activeCalories}
                      </div>
                      <div className="text-[9px] text-neutral-500 font-mono">kcal</div>
                    </div>

                    {/* Protein */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                      <div className="text-[10px] font-semibold text-sky-400">Protein</div>
                      <div className="text-base font-mono font-bold text-sky-300">
                        {formatMacro(activeProtein, unitSystem)}
                      </div>
                      <div className="text-[9px] text-neutral-500 font-mono">
                        {activeCalories > 0
                          ? Math.round(((activeProtein * 4) / activeCalories) * 100)
                          : 0}
                        % kcal
                      </div>
                    </div>

                    {/* Carbs */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                      <div className="text-[10px] font-semibold text-amber-400">Carbs</div>
                      <div className="text-base font-mono font-bold text-amber-300">
                        {formatMacro(activeCarbs, unitSystem)}
                      </div>
                      <div className="text-[9px] text-neutral-500 font-mono">
                        {activeCalories > 0
                          ? Math.round(((activeCarbs * 4) / activeCalories) * 100)
                          : 0}
                        % kcal
                      </div>
                    </div>

                    {/* Fat */}
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                      <div className="text-[10px] font-semibold text-rose-400">Fat</div>
                      <div className="text-base font-mono font-bold text-rose-300">
                        {formatMacro(activeFat, unitSystem)}
                      </div>
                      <div className="text-[9px] text-neutral-500 font-mono">
                        {activeCalories > 0
                          ? Math.round(((activeFat * 9) / activeCalories) * 100)
                          : 0}
                        % kcal
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Editable fine tuning inputs */
                  <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-700/80 space-y-2.5">
                    <div className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Manual Override for this Log</span>
                      <span className="text-[10px] text-neutral-400 font-normal">Adjust any number</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-emerald-400">Calories</label>
                        <input
                          type="number"
                          value={customCalories}
                          onChange={(e) => setCustomCalories(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-400 text-center focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-sky-400">Protein (g)</label>
                        <input
                          type="number"
                          value={customProtein}
                          onChange={(e) => setCustomProtein(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-sky-300 text-center focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-amber-400">Carbs (g)</label>
                        <input
                          type="number"
                          value={customCarbs}
                          onChange={(e) => setCustomCarbs(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 text-center focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-rose-400">Fat (g)</label>
                        <input
                          type="number"
                          value={customFat}
                          onChange={(e) => setCustomFat(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-rose-300 text-center focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Composite Ingredients Breakdown */}
                {aiResult.ingredients && aiResult.ingredients.length > 0 && (
                  <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40">
                    <button
                      type="button"
                      onClick={() => setShowIngredients(!showIngredients)}
                      className="w-full px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Detected Ingredients ({aiResult.ingredients.length})</span>
                      </span>
                      {showIngredients ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {showIngredients && (
                      <div className="p-3 pt-0 space-y-1.5 text-xs divide-y divide-neutral-800/60">
                        {aiResult.ingredients.map((ing, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                            <div>
                              <span className="font-medium text-neutral-200">{ing.name}</span>
                              <span className="text-[10px] text-neutral-400 ml-1.5">({ing.portion})</span>
                            </div>
                            <div className="text-[11px] font-mono text-neutral-300">
                              {Math.round(ing.calories * currentMult)} kcal · P: {Math.round(ing.protein * currentMult)}g
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Summary / Insight */}
                {aiResult.summary && (
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-xs text-neutral-300 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Dietitian Insight: </span>
                      <span className="text-neutral-300">{aiResult.summary}</span>
                    </div>
                  </div>
                )}

                {/* Save to custom foods checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300 select-none">
                  <input
                    type="checkbox"
                    checked={saveToCustomFoods}
                    onChange={(e) => setSaveToCustomFoods(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Save to custom foods for 1-click future logging</span>
                </label>

                {/* Action CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-800 transition-all flex items-center justify-center gap-1.5"
                    title="Cancel and return to Today's screen"
                  >
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Return Home</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogAiMeal}
                    disabled={logSuccess}
                    className={`flex-1 w-full py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                      logSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/25 active:scale-[0.99]'
                    }`}
                  >
                    {logSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Meal Logged Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>
                          Log to {selectedMealType.toUpperCase()} ({activeCalories} kcal)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Database Search */}
        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input & Category Filters */}
            <div className="p-4 space-y-3 border-b border-neutral-800">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search chicken breast, rice, salmon, oats, avocado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                        : 'text-neutral-400 hover:text-white bg-neutral-950/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Foods List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-neutral-800/40">
              {filteredFoods.length > 0 ? (
                filteredFoods.map((food) => {
                  const isSelected = selectedItem?.id === food.id;
                  return (
                    <div
                      key={food.id}
                      onClick={() => handleSelectItem(food)}
                      className={`pt-2 first:pt-0 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-neutral-800/90 border border-emerald-500/50'
                          : 'hover:bg-neutral-950/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{food.name}</div>
                          <div className="text-[11px] text-neutral-400">
                            {food.servingDescription} · {food.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            {food.calories} kcal
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            P: {formatMacro(food.protein, unitSystem)} · C: {formatMacro(food.carbs, unitSystem)} · F: {formatMacro(food.fat, unitSystem)}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Serving Tuning if selected */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-neutral-700/60 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-300 font-medium">Servings:</span>
                            <div className="flex items-center gap-1">
                              {[0.5, 1, 1.5, 2].map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDbMultiplier(s);
                                  }}
                                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    dbMultiplier === s
                                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                                      : 'bg-neutral-900 text-neutral-300 border border-neutral-700'
                                  }`}
                                >
                                  {s}x
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSelectedItem();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add ({Math.round(food.calories * dbMultiplier)} kcal)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-neutral-500 space-y-2">
                  <p>No food found matching "{searchQuery}".</p>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className="text-emerald-400 font-semibold underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Calculate custom meal with AI</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search Tab Bottom Footer */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Found {filteredFoods.length} foods
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Cancel and return to Today's screen"
              >
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Quick Calorie Add */}
        {activeTab === 'quick' && (
          <form onSubmit={handleQuickAdd} className="p-5 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">Food / Meal Name (Optional)</label>
                {quickName.trim() && (
                  <button
                    type="button"
                    disabled={quickAiLoading}
                    onClick={handleQuickAddAiFill}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    {quickAiLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>Auto-fill with AI</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. Protein Smoothie, Snack, Coffee with Milk"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Calories (kcal) *</label>
              <input
                type="number"
                required
                min="0"
                max="5000"
                value={quickCalories}
                onChange={(e) => setQuickCalories(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-sky-400">Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  value={quickProtein}
                  onChange={(e) => setQuickProtein(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-amber-400">Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  value={quickCarbs}
                  onChange={(e) => setQuickCarbs(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-rose-400">Fat (g)</label>
                <input
                  type="number"
                  min="0"
                  value={quickFat}
                  onChange={(e) => setQuickFat(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-auto px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-800 transition-all flex items-center justify-center gap-1.5"
                title="Cancel and return to Today's screen"
              >
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                <span>Return Home</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-md"
              >
                Add {quickCalories || 0} kcal to {selectedMealType.toUpperCase()}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Create Custom Food */}
        {activeTab === 'custom' && (
          <form onSubmit={handleSaveCustomFood} className="p-5 space-y-3.5 overflow-y-auto">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">Food Name *</label>
                {customName.trim() && (
                  <button
                    type="button"
                    disabled={customAiLoading}
                    onClick={handleCustomFoodAiEstimate}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    {customAiLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>Auto-calculate Macros with AI</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. My Favorite Whey Smoothie"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Serving Size</label>
                <input
                  type="text"
                  placeholder="e.g. 1 scoop (35g)"
                  value={customServing}
                  onChange={(e) => setCustomServing(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Category</label>
                <select
                  value={customCat}
                  onChange={(e: any) => setCustomCat(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Proteins">Proteins</option>
                  <option value="Carbohydrates">Carbohydrates</option>
                  <option value="Fats & Dairy">Fats & Dairy</option>
                  <option value="Produce">Produce</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-emerald-400">Calories *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={customCals}
                  onChange={(e) => setCustomCals(e.target.value)}
                  placeholder="kcal"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-sky-400">Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  value={customP}
                  onChange={(e) => setCustomP(e.target.value)}
                  placeholder="g"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-amber-400">Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  value={customC}
                  onChange={(e) => setCustomC(e.target.value)}
                  placeholder="g"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-rose-400">Fat (g)</label>
                <input
                  type="number"
                  min="0"
                  value={customF}
                  onChange={(e) => setCustomF(e.target.value)}
                  placeholder="g"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-auto px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-800 transition-all flex items-center justify-center gap-1.5"
                title="Cancel and return to Today's screen"
              >
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                <span>Return Home</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-md"
              >
                Save Custom Food & Add to {selectedMealType.toUpperCase()}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
