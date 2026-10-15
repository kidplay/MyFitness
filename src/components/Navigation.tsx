import React from 'react';
import {
  Home,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

export type TabType = 'today' | 'train' | 'nutrition' | 'progress' | 'coach';

interface NavigationProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenActiveWorkout?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasBadge?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onChangeTab,
  onOpenActiveWorkout,
}) => {
  const { activeWorkout } = useFitness();

  const navItems: NavItem[] = [
    { id: 'today', label: 'Today', icon: Home },
    { id: 'train', label: 'Train', icon: Dumbbell, hasBadge: !!activeWorkout },
    { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'coach', label: 'Coach', icon: Sparkles },
  ];

  return (
    <>
      {/* Floating Active Workout Pill if active on any other tab */}
      {activeWorkout && currentTab !== 'train' && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-40">
          <button
            onClick={() => {
              onChangeTab('train');
              if (onOpenActiveWorkout) onOpenActiveWorkout();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-neutral-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-neutral-950" />
            <span>Active: {activeWorkout.name}</span>
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800/90 px-1 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex-1 min-w-0 min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-medium transition-colors relative ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
              <span className="truncate">{item.label}</span>
              {item.hasBadge && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1.5 right-4" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
