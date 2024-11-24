import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react';
import { useStore } from '../store';
import { Timer as TimerComponent } from '../components/Timer';
import { TimerPicker } from '../components/TimerPicker';
import { motion, AnimatePresence } from 'framer-motion';

export function CookingModePage() {
  const navigate = useNavigate();
  const { currentMeal, startTimer } = useStore();
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  // Redirect if no recipes in current meal
  if (currentMeal.recipes.length === 0) {
    navigate('/current-meal');
    return null;
  }

  const currentRecipe = currentMeal.recipes[currentRecipeIndex];
  const currentStep = currentRecipe?.steps[currentStepIndex];
  const totalSteps = currentMeal.recipes.reduce(
    (total, recipe) => total + recipe.steps.length,
    0
  );

  const currentStepNumber = currentMeal.recipes
    .slice(0, currentRecipeIndex)
    .reduce((total, recipe) => total + recipe.steps.length, 0) + currentStepIndex + 1;

  const nextStep = () => {
    if (!currentRecipe) return;

    if (currentStepIndex < currentRecipe.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (currentRecipeIndex < currentMeal.recipes.length - 1) {
      setCurrentRecipeIndex(currentRecipeIndex + 1);
      setCurrentStepIndex(0);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else if (currentRecipeIndex > 0) {
      setCurrentRecipeIndex(currentRecipeIndex - 1);
      setCurrentStepIndex(
        currentMeal.recipes[currentRecipeIndex - 1].steps.length - 1
      );
    }
  };

  const handleStartTimer = (totalSeconds: number) => {
    startTimer(Math.ceil(totalSeconds / 60));
  };

  if (!currentRecipe || !currentStep) return null;

  return (
    <div className="min-h-screen bg-[#F8F8F8] relative">
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/current-meal')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowTimerPicker(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Timer className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="card space-y-4">
            <h2 className="text-2xl font-bold text-[#FF6B6B]">
              {currentRecipe.title}
            </h2>
            <div className="text-sm font-medium text-gray-500">
              Step {currentStepNumber} of {totalSteps}
            </div>

            <p className="text-2xl text-gray-800 leading-relaxed py-6">
              {currentStep}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="fixed inset-y-0 left-0 flex items-center">
        <button
          onClick={previousStep}
          disabled={currentRecipeIndex === 0 && currentStepIndex === 0}
          className="p-3 bg-white/80 backdrop-blur-sm rounded-r-xl shadow-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="fixed inset-y-0 right-0 flex items-center">
        <button
          onClick={nextStep}
          disabled={
            currentRecipeIndex === currentMeal.recipes.length - 1 &&
            currentStepIndex === currentRecipe.steps.length - 1
          }
          className="p-3 bg-white/80 backdrop-blur-sm rounded-l-xl shadow-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <TimerComponent />

      <AnimatePresence>
        {showTimerPicker && (
          <TimerPicker
            onClose={() => setShowTimerPicker(false)}
            onStart={handleStartTimer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}