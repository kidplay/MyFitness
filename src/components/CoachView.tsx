import React, { useState, useEffect, useRef } from 'react';
import { useFitness } from '../context/FitnessContext';
import { formatMacro, formatLiquidVolume } from '../utils/unitConversion';
import {
  Sparkles,
  Bot,
  Send,
  Plus,
  Check,
  RefreshCw,
  Zap,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Logo } from './Logo';

interface CoachViewProps {
  onGoHome?: () => void;
}

export const CoachView: React.FC<CoachViewProps> = ({ onGoHome }) => {
  const {
    userProfile,
    selectedDate,
    todayRecord,
    getNutritionalTotalsForDate,
    addFoodItem,
    unitSystem,
  } = useFitness();

  const totals = getNutritionalTotalsForDate(selectedDate);
  const lastFetchedKeyRef = useRef<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [adviceData, setAdviceData] = useState<{
    summary: string;
    tips: string[];
    suggestedMeal: {
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      rationale: string;
    };
  } | null>(null);

  const [mealAdded, setMealAdded] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'coach'; text: string }>>([]);
  const [isAskingQuestion, setIsAskingQuestion] = useState<boolean>(false);

  const fetchAdvice = async () => {
    setIsLoading(true);
    setMealAdded(false);
    try {
      const response = await fetch('/api/coach/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: userProfile,
          dailyNutrition: totals,
          todayWorkouts: todayRecord.workouts,
        }),
      });

      if (!response.ok) throw new Error('Failed to load coach advice');
      const data = await response.json();
      setAdviceData(data);
    } catch (err) {
      console.warn('Fallback coach advice used:', err);
      // Clean fallback
      const remainingCals = Math.max(0, totals.remainingCalories);
      setAdviceData({
        summary: `You have ${remainingCals} kcal remaining today. You're making solid progress toward your ${userProfile.goal === 'lose_weight' ? 'weight loss' : 'muscle gain'} goal!`,
        tips: [
          `Aim for ${formatMacro(Math.max(0, userProfile.targetProtein - totals.consumedProtein), unitSystem)} more protein to hit your daily muscle maintenance target.`,
          `Drink at least ${formatLiquidVolume(500, unitSystem)} water within the next hour to optimize nutrient absorption.`,
          'Keep your evening carbohydrates complex to sustain overnight glycogen stores without blood sugar spikes.',
        ],
        suggestedMeal: {
          name: 'Grilled Salmon with Sweet Potato & Steamed Greens',
          calories: 520,
          protein: 42,
          carbs: 45,
          fat: 16,
          rationale: 'Clean macronutrient distribution providing omega-3 fatty acids and slow-digesting carbs to finish your day.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchKey = `${selectedDate}_${userProfile.currentWeightKg}_${totals.consumedCalories}_${todayRecord.workouts.length}`;
    if (lastFetchedKeyRef.current === fetchKey && adviceData) {
      return;
    }
    lastFetchedKeyRef.current = fetchKey;
    fetchAdvice();
  }, [selectedDate, userProfile.currentWeightKg, totals.consumedCalories, todayRecord.workouts.length]);

  const handleAddSuggestedMeal = () => {
    if (!adviceData?.suggestedMeal) return;
    const m = adviceData.suggestedMeal;
    addFoodItem('dinner', {
      name: m.name,
      servingDescription: 'Coach Recommended Meal',
      servingMultiplier: 1,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      category: 'Dinner',
      aiScanned: true,
    });
    setMealAdded(true);
  };

  const handleAskQuickPrompt = (promptText: string) => {
    setCustomQuestion(promptText);
    submitQuestion(promptText);
  };

  const submitQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg = questionText.trim();
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setCustomQuestion('');
    setIsAskingQuestion(true);

    try {
      const response = await fetch('/api/coach/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: userProfile,
          dailyNutrition: totals,
          todayWorkouts: todayRecord.workouts,
          userQuestion: userMsg,
        }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const reply = `${data.summary} ${data.tips?.[0] || ''}`;
      setChatHistory((prev) => [...prev, { sender: 'coach', text: reply }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'coach',
          text: `Based on your remaining budget of ${totals.remainingCalories} kcal, I suggest focusing on lean proteins like chicken breast, Greek yogurt, or white fish paired with high-volume greens to stay full and hit your target.`,
        },
      ]);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">MyFitness AI Coach</h2>
              <p className="text-xs text-neutral-400">
                Personalized nutrition & workout intelligence grounded in your daily numbers
              </p>
            </div>
          </div>

          <button
            onClick={fetchAdvice}
            disabled={isLoading}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Refresh Analysis"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* Dynamic Coach Status Summary */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
            <p className="text-xs text-neutral-400">Analyzing your daily macros and training volume...</p>
          </div>
        ) : adviceData ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-neutral-200 leading-relaxed">
              <span className="font-bold text-emerald-400 block mb-1">Daily Status:</span>
              {adviceData.summary}
            </div>

            {/* Practical Action Tips */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-neutral-300">
                Key Recommendations
              </h4>
              <div className="divide-y divide-neutral-800/60 border-y border-neutral-800/80">
                {adviceData.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 text-xs text-neutral-300 flex items-start gap-2.5"
                  >
                    <span className="font-mono text-emerald-400 font-bold shrink-0">
                      0{idx + 1}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Meal Idea */}
            {adviceData.suggestedMeal && (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Recommended Meal for Remaining Macros</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {adviceData.suggestedMeal.calories} kcal
                  </span>
                </div>

                <div>
                  <div className="text-sm font-bold text-white">{adviceData.suggestedMeal.name}</div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-0.5">
                    <span>P: <strong className="text-sky-300">{formatMacro(adviceData.suggestedMeal.protein, unitSystem)}</strong></span>
                    <span>·</span>
                    <span>C: <strong className="text-amber-300">{formatMacro(adviceData.suggestedMeal.carbs, unitSystem)}</strong></span>
                    <span>·</span>
                    <span>F: <strong className="text-rose-300">{formatMacro(adviceData.suggestedMeal.fat, unitSystem)}</strong></span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 italic">
                    "{adviceData.suggestedMeal.rationale}"
                  </p>
                </div>

                <button
                  onClick={handleAddSuggestedMeal}
                  disabled={mealAdded}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    mealAdded
                      ? 'bg-neutral-800 text-emerald-400'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md'
                  }`}
                >
                  {mealAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Today's Dinner!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Log Recommended Meal to Dinner</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Interactive Coaching Chat / Questions */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
        <h3 className="text-base font-bold text-white">Ask Coach Anything</h3>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            'What should I eat for dinner?',
            'How to break a weight plateau?',
            'Best pre-workout meal timing?',
            'Adjust calories for rest day',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleAskQuickPrompt(promptText)}
              className="py-1.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-emerald-500/50 transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="space-y-2.5 max-h-60 overflow-y-auto p-2 bg-neutral-950/40 rounded-2xl border border-neutral-800/60">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-neutral-800 text-white'
                    : 'mr-auto bg-emerald-500/10 border border-emerald-500/20 text-neutral-200'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isAskingQuestion && (
              <div className="text-xs text-neutral-400 italic flex items-center gap-1.5 p-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>Coach is thinking...</span>
              </div>
            )}
          </div>
        )}

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion(customQuestion);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about your workout, macros, or recovery..."
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!customQuestion.trim() || isAskingQuestion}
            className="p-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
