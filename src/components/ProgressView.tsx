import React, { useState, useMemo } from 'react';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_LIBRARY } from '../data/initialData';
import {
  formatWeight,
  formatWorkoutWeight,
  kgToLbs,
  KG_TO_LBS,
} from '../utils/unitConversion';
import {
  Scale,
  Award,
  Dumbbell,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface ProgressViewProps {
  onOpenWeightModal: () => void;
  onGoHome?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onOpenWeightModal, onGoHome }) => {
  const {
    weightLogs,
    userProfile,
    dayRecords,
    streakDays,
    deleteWeightLog,
    milestones,
    getExerciseHistory,
    unitSystem,
  } = useFitness();

  const isImperial = unitSystem === 'imperial';

  const [activeSection, setActiveSection] = useState<'weight' | 'workouts' | 'milestones'>('weight');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState<string>('Barbell Flat Bench Press');

  // Filter weight logs based on range
  const filteredWeightLogs = useMemo(() => {
    if (weightLogs.length === 0) return [];
    const daysLimit =
      timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysLimit);
    const year = cutoff.getFullYear();
    const month = String(cutoff.getMonth() + 1).padStart(2, '0');
    const day = String(cutoff.getDate()).padStart(2, '0');
    const cutoffStr = `${year}-${month}-${day}`;

    const filtered = weightLogs.filter((log) => log.date >= cutoffStr);
    return filtered.length > 0 ? filtered : weightLogs.slice(-daysLimit);
  }, [weightLogs, timeRange]);

  const startWeightKg = weightLogs[0]?.weightKg || userProfile.currentWeightKg;
  const currentWeightKg = userProfile.currentWeightKg;
  const targetWeightKg = userProfile.targetWeightKg;

  const diffKg = startWeightKg - currentWeightKg;
  const diffDisplayVal = isImperial ? (diffKg * KG_TO_LBS).toFixed(1) : diffKg.toFixed(1);
  const diffSign = parseFloat(diffDisplayVal) > 0 ? `-${diffDisplayVal}` : `+${Math.abs(parseFloat(diffDisplayVal))}`;

  // SVG Chart Geometry for Weight Line
  const chartData = useMemo(() => {
    if (filteredWeightLogs.length < 2) return null;

    const weights = filteredWeightLogs.map((l) =>
      isImperial ? kgToLbs(l.weightKg, 1) : l.weightKg
    );
    const targetW = isImperial ? kgToLbs(targetWeightKg, 1) : targetWeightKg;

    const minW = Math.min(...weights, targetW) - (isImperial ? 1.0 : 0.5);
    const maxW = Math.max(...weights) + (isImperial ? 1.0 : 0.5);
    const rangeW = maxW - minW || 1;

    const width = 600;
    const height = 180;
    const padX = 20;
    const padY = 25;

    const points = filteredWeightLogs.map((log, index) => {
      const val = isImperial ? kgToLbs(log.weightKg, 1) : log.weightKg;
      const x = padX + (index / (filteredWeightLogs.length - 1)) * (width - 2 * padX);
      const y = height - padY - ((val - minW) / rangeW) * (height - 2 * padY);
      return { x, y, weight: val, date: log.date };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;
    const targetY = height - padY - ((targetW - minW) / rangeW) * (height - 2 * padY);

    return { points, pathD, areaD, targetY, minW, maxW, width, height, targetW };
  }, [filteredWeightLogs, targetWeightKg, isImperial]);

  // Workout Aggregates
  const allCompletedWorkouts = useMemo(() => {
    const list = Object.values(dayRecords)
      .flatMap((r) => r.workouts)
      .sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [dayRecords]);

  const totalWorkoutMinutes = allCompletedWorkouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const totalVolumeKg = allCompletedWorkouts.reduce((sum, w) => {
    return (
      sum +
      w.exercises.reduce((exSum, ex) => {
        return exSum + ex.sets.reduce((sSum, s) => sSum + (s.completed ? s.weightKg * s.reps : 0), 0);
      }, 0)
    );
  }, 0);

  // Available exercises for strength history (prioritizing exercises with logged history)
  const exerciseOptions = useMemo(() => {
    const counts = new Map<string, number>();
    Object.values(dayRecords).forEach((rec) => {
      rec.workouts.forEach((w) => {
        w.exercises.forEach((ex) => {
          counts.set(ex.name, (counts.get(ex.name) || 0) + 1);
        });
      });
    });

    const loggedNames = Array.from(counts.keys());
    const libraryNames = EXERCISE_LIBRARY.map((e) => e.name).filter((n) => !counts.has(n));

    return [
      ...loggedNames.map((name) => ({ name, count: counts.get(name) || 0 })),
      ...libraryNames.map((name) => ({ name, count: 0 })),
    ];
  }, [dayRecords]);

  // Exercise history for selected exercise
  const exerciseHistory = useMemo(() => {
    return getExerciseHistory(selectedExerciseForHistory);
  }, [selectedExerciseForHistory, getExerciseHistory]);

  const completedMilestonesCount = milestones.filter((m) => m.completed).length;
  const milestonesPercent = Math.round((completedMilestonesCount / milestones.length) * 100);

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Top Segmented Tabs: Weight, Workout, Milestones */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <button
          onClick={() => setActiveSection('weight')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'weight'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>Body & Weight</span>
        </button>

        <button
          onClick={() => setActiveSection('workouts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'workouts'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
          <span>Workout Progress</span>
        </button>

        <button
          onClick={() => setActiveSection('milestones')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'milestones'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-sky-400" />
          <span>Milestones ({completedMilestonesCount}/{milestones.length})</span>
        </button>
      </div>

      {/* SECTION 1: BODY & WEIGHT */}
      {activeSection === 'weight' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Weight Progression</h2>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Goal: {userProfile.goal.replace(/_/g, ' ')} to{' '}
                  <span className="text-emerald-400 font-semibold">
                    {formatWeight(targetWeightKg, unitSystem)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                  {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-2.5 py-1 rounded-lg font-medium uppercase transition-colors ${
                        timeRange === r
                          ? 'bg-neutral-800 text-white font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onOpenWeightModal}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Weight</span>
                </button>
              </div>
            </div>

            {/* Weight Stat Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800 border-y border-neutral-800/80 py-3">
              <div className="py-1 sm:py-0 sm:pr-4">
                <div className="text-[11px] text-neutral-400">Starting Weight</div>
                <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                  {formatWeight(startWeightKg, unitSystem)}
                </div>
              </div>

              <div className="py-1 sm:py-0 sm:px-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">Current</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    BMI {userProfile.bmi || 24.1}
                  </span>
                </div>
                <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                  {formatWeight(currentWeightKg, unitSystem)}
                </div>
              </div>

              <div className="py-1 sm:py-0 sm:px-4">
                <div className="text-[11px] text-neutral-400">Goal Target</div>
                <div className="text-lg font-bold text-neutral-200 font-mono tabular-nums mt-0.5">
                  {formatWeight(targetWeightKg, unitSystem)}
                </div>
              </div>

              <div className="py-1 sm:py-0 sm:pl-4">
                <div className="text-[11px] text-neutral-400">Weight Change</div>
                <div className="text-lg font-bold text-sky-400 font-mono tabular-nums mt-0.5">
                  {diffSign} {isImperial ? 'lbs' : 'kg'}
                </div>
              </div>
            </div>

            {/* Interactive SVG Trend Chart */}
            {chartData ? (
              <div className="relative pt-2 overflow-hidden">
                <div className="w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                    className="w-full h-40 sm:h-52 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Target line */}
                    <line
                      x1="20"
                      y1={chartData.targetY}
                      x2={chartData.width - 20}
                      y2={chartData.targetY}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />

                    {/* Area fill */}
                    <path d={chartData.areaD} fill="url(#weightGrad)" />

                    {/* Stroke line */}
                    <path
                      d={chartData.pathD}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {chartData.points.map((pt, i) => (
                      <g key={i} className="group cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={i === chartData.points.length - 1 ? '5' : '3'}
                          fill={i === chartData.points.length - 1 ? '#10b981' : '#34d399'}
                          className="transition-all hover:r-6"
                        />
                        <title>{`${pt.date}: ${pt.weight} ${isImperial ? 'lbs' : 'kg'}`}</title>
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono pt-1">
                  <span>Target: {chartData.targetW} {isImperial ? 'lbs' : 'kg'}</span>
                  <span>Unit: {isImperial ? 'Pounds (lbs)' : 'Kilograms (kg)'}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500">
                Log at least 2 weigh-ins to render progression curve
              </div>
            )}
          </div>

          {/* Weigh-in Logs History Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
            <h3 className="text-sm font-bold text-white tracking-tight pb-2 border-b border-neutral-800">
              Recent Weigh-in History
            </h3>
            <div className="divide-y divide-neutral-800/60 max-h-60 overflow-y-auto pr-1">
              {[...weightLogs].reverse().map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums text-neutral-300">{log.date}</span>
                    {log.note && <span className="text-neutral-500">{log.note}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums font-bold text-emerald-400 text-sm">
                      {formatWeight(log.weightKg, unitSystem)}
                    </span>
                    <button
                      onClick={() => deleteWeightLog(log.id)}
                      className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WORKOUT PROGRESS & STRENGTH */}
      {activeSection === 'workouts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Workout Stats Header Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Workout Progression</h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                {allCompletedWorkouts.length} Sessions
              </span>
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800 border-t border-neutral-800 pt-4">
              <div className="py-1 sm:py-0 sm:pr-4">
                <div className="text-[11px] text-neutral-400">Total Volume</div>
                <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                  {isImperial
                    ? `${Math.round(totalVolumeKg * KG_TO_LBS).toLocaleString()} lbs`
                    : `${Math.round(totalVolumeKg).toLocaleString()} kg`}
                </div>
              </div>

              <div className="py-1 sm:py-0 sm:px-4">
                <div className="text-[11px] text-neutral-400">Time Trained</div>
                <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                  {totalWorkoutMinutes} mins
                </div>
              </div>

              <div className="py-1 sm:py-0 sm:px-4">
                <div className="text-[11px] text-neutral-400">Calories Burned</div>
                <div className="text-lg font-bold text-amber-400 font-mono tabular-nums mt-0.5">
                  {allCompletedWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0)} kcal
                </div>
              </div>

              <div className="py-1 sm:py-0 sm:pl-4">
                <div className="text-[11px] text-neutral-400">Active Streak</div>
                <div className="text-lg font-bold text-sky-400 font-mono tabular-nums mt-0.5">
                  {streakDays} Days
                </div>
              </div>
            </div>
          </div>

          {/* Strength Progression & Exercise 1RM Tracker */}
          <div className="p-4 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Strength History by Exercise</h3>
                <p className="text-xs text-neutral-400">Track weight overload progression for your key compound movements</p>
              </div>

              <select
                value={selectedExerciseForHistory}
                onChange={(e) => setSelectedExerciseForHistory(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 max-w-xs"
              >
                {exerciseOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.name} {opt.count > 0 ? `(${opt.count} logs)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise Records Log */}
            {exerciseHistory.length > 0 ? (
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {exerciseHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{item.date}</div>
                        <div className="text-[11px] text-neutral-400">
                          {item.totalReps} total reps · {formatWorkoutWeight(item.totalVolume, unitSystem)} volume
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black font-mono text-amber-400">
                          {formatWorkoutWeight(item.maxWeight, unitSystem)}
                        </div>
                        <div className="text-[9px] uppercase font-bold text-neutral-500">Top Weight</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-500">
                No recorded logs yet for "{selectedExerciseForHistory}". Log a session containing this movement to populate historical progression.
              </div>
            )}
          </div>

          {/* Recent Workout Logs List */}
          <div className="p-4 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
            <h3 className="text-base font-bold text-white tracking-tight">Completed Sessions</h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {allCompletedWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{w.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold font-mono">
                        {w.category || 'Strength'}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {w.date} · {w.durationMinutes} mins · {w.exercises.length} exercises · -{w.caloriesBurned} kcal
                    </div>
                  </div>

                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MILESTONES & BADGES */}
      {activeSection === 'milestones' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Milestone Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-sky-950/30 border border-sky-500/20 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center text-2xl shadow-inner">
                  🏆
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Milestone Roadmap</h2>
                  <p className="text-xs text-neutral-400">
                    Achieve key fitness, consistency, and strength goals
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black font-mono text-sky-400">
                  {completedMilestonesCount}/{milestones.length}
                </div>
                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  {milestonesPercent}% Complete
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-neutral-950 overflow-hidden p-0.5 border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${milestonesPercent}%` }}
              />
            </div>
          </div>

          {/* Milestones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((m) => {
              const progressPct = m.completed
                ? 100
                : Math.min(100, Math.max(0, Math.round((m.currentValue / (m.targetValue || 1)) * 100)));

              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-3 ${
                    m.completed
                      ? 'bg-neutral-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'bg-neutral-900/50 border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.rewardIcon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{m.title}</h4>
                          {m.completed && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              UNLOCKED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{m.description}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                        m.category === 'weight'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : m.category === 'workout'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}
                    >
                      {m.category}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-400">
                        {m.currentValue} / {m.targetValue} {m.unit}
                      </span>
                      <span className={m.completed ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                        {progressPct}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          m.completed ? 'bg-emerald-400' : 'bg-neutral-700'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
