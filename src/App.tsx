import React, { useState } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { TodayView } from './components/TodayView';
import { NutritionView } from './components/NutritionView';
import { TrainView } from './components/TrainView';
import { ProgressView } from './components/ProgressView';
import { CoachView } from './components/CoachView';
import { FoodScannerModal } from './components/FoodScannerModal';
import { FoodSearchModal } from './components/FoodSearchModal';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { WorkoutTemplateModal } from './components/WorkoutTemplateModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileModal } from './components/ProfileModal';
import { WeightLogModal } from './components/WeightLogModal';
import { MealType } from './types';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<TabType>('today');
  const {
    activeWorkout,
    isOnboardingOpen,
    isWorkoutTemplateModalOpen,
    setIsWorkoutTemplateModalOpen,
  } = useFitness();

  // Modal triggers
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerMealType, setScannerMealType] = useState<MealType>('lunch');

  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState<boolean>(false);
  const [foodSearchMealType, setFoodSearchMealType] = useState<MealType>('breakfast');
  const [foodSearchInitialTab, setFoodSearchInitialTab] = useState<'ai' | 'search' | 'quick' | 'custom'>('ai');

  const [isActiveWorkoutOpen, setIsActiveWorkoutOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState<boolean>(false);

  const handleOpenScanner = (mealType: MealType = 'lunch') => {
    setScannerMealType(mealType);
    setIsScannerOpen(true);
  };

  const handleOpenFoodSearch = (
    mealType: MealType = 'breakfast',
    tab: 'ai' | 'search' | 'quick' | 'custom' = 'ai'
  ) => {
    setFoodSearchMealType(mealType);
    setFoodSearchInitialTab(tab);
    setIsFoodSearchOpen(true);
  };

  const handleStartWorkout = () => {
    if (activeWorkout) {
      setIsActiveWorkoutOpen(true);
    } else {
      setIsWorkoutTemplateModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-neutral-950 w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onGoHome={() => setCurrentTab('today')}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-5 pb-28 md:pb-10 overflow-x-hidden">
        {/* Mobile Navigation & Active Workout Floating Pill */}
        <Navigation
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
        />

        {/* Tab Views */}
        <div>
          {currentTab === 'today' && (
            <TodayView
              onOpenScanner={handleOpenScanner}
              onOpenFoodSearch={handleOpenFoodSearch}
              onStartWorkout={handleStartWorkout}
              onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
              onOpenWeightModal={() => setIsWeightModalOpen(true)}
              onSwitchTab={setCurrentTab}
            />
          )}

          {currentTab === 'train' && (
            <TrainView
              onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
              onGoHome={() => setCurrentTab('today')}
            />
          )}

          {currentTab === 'nutrition' && (
            <NutritionView
              onOpenScanner={handleOpenScanner}
              onOpenFoodSearch={handleOpenFoodSearch}
              onGoHome={() => setCurrentTab('today')}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressView
              onOpenWeightModal={() => setIsWeightModalOpen(true)}
              onGoHome={() => setCurrentTab('today')}
            />
          )}

          {currentTab === 'coach' && (
            <CoachView onGoHome={() => setCurrentTab('today')} />
          )}
        </div>
      </main>

      {/* Modals */}
      <WorkoutTemplateModal
        isOpen={isWorkoutTemplateModalOpen}
        onClose={() => setIsWorkoutTemplateModalOpen(false)}
        onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
      />

      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        defaultMealType={scannerMealType}
      />

      <FoodSearchModal
        isOpen={isFoodSearchOpen}
        onClose={() => setIsFoodSearchOpen(false)}
        defaultMealType={foodSearchMealType}
        initialTab={foodSearchInitialTab}
      />

      <ActiveWorkoutModal
        isOpen={isActiveWorkoutOpen}
        onClose={() => setIsActiveWorkoutOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <WeightLogModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
      />
    </div>
  );
}

export default function App() {
  return (
    <FitnessProvider>
      <MainApp />
    </FitnessProvider>
  );
}
