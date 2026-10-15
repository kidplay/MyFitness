import React from 'react';
import { useFitness } from '../context/FitnessContext';
import { getTodayDateString } from '../data/initialData';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Home,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Logo } from './Logo';
import { TabType } from './Navigation';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenWeightModal: () => void;
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  currentTab,
  onChangeTab,
  onGoHome,
}) => {
  const {
    selectedDate,
    setSelectedDate,
    streakDays,
    userProfile,
    unitSystem,
    toggleUnitSystem,
    activeWorkout,
  } = useFitness();

  const todayStr = getTodayDateString(0);
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
    if (onGoHome) onGoHome();
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    return `${month} ${dayNum}`;
  };

  const navItems: Array<{
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    hasBadge?: boolean;
  }> = [
    { id: 'today', label: 'Today', icon: Home },
    { id: 'train', label: 'Train', icon: Dumbbell, hasBadge: !!activeWorkout },
    { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'coach', label: 'Coach', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-3 sm:px-6 py-2.5 w-full">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 w-full">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <Logo
            showText
            size="sm"
            onClick={() => onChangeTab('today')}
          />
        </div>

        {/* Zone 2: Desktop Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/70 border border-neutral-800/80 rounded-xl p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 relative ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
                {item.hasBadge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Compact Date Selector, Unit Switcher & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Date Navigator */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
            <button
              onClick={handlePrevDay}
              className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleGoToday}
              className="px-2 py-0.5 text-xs font-semibold text-neutral-200 hover:text-white transition-colors whitespace-nowrap font-mono"
              title="Jump to Today"
            >
              {isToday ? 'Today' : formatDateDisplay(selectedDate)}
            </button>

            <button
              onClick={handleNextDay}
              className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Unit Toggle */}
          <button
            onClick={toggleUnitSystem}
            title={`Switch to ${unitSystem === 'metric' ? 'Imperial (lbs)' : 'Metric (kg)'}`}
            className="px-2 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono font-semibold text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
          >
            {unitSystem === 'metric' ? 'kg' : 'lbs'}
          </button>

          {/* Profile & Streak Trigger */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white transition-colors"
            title={`${userProfile.nickname || userProfile.name} · ${streakDays}d streak`}
          >
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.nickname || userProfile.name}
                className="w-6 h-6 rounded-lg object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            {!userProfile.avatarUrl && (
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs font-bold">
                {(userProfile.nickname || userProfile.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="flex items-center gap-0.5 text-xs font-mono font-semibold text-amber-400">
              <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
              {streakDays}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
