import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStore } from '../store';

export function Onboarding() {
  const location = useLocation();
  const { 
    onboarding,
    markOnboardingComplete,
    completeOnboardingStep,
    suggestions,
    currentMeal,
  } = useStore();

  useEffect(() => {
    // Skip if onboarding is already completed
    if (onboarding.hasCompletedOnboarding) return;

    const showOnboardingStep = () => {
      // Initial welcome message
      toast(
        <div className="flex flex-col">
          <span className="font-medium">Welcome to Oh Sure Chef! 👋</span>
          <span className="text-sm text-gray-600 mt-1">
            Let's help you make something delicious
          </span>
        </div>,
        { duration: 4000 }
      );

      // Step 1: Search for recipes
      setTimeout(() => {
        if (!onboarding.steps.search) {
          toast(
            <div className="flex flex-col">
              <span>Try asking "Show me some pasta recipes"</span>
              <span className="text-sm text-gray-500 mt-1">Type in the chat below</span>
            </div>,
            { duration: 5000 }
          );
          completeOnboardingStep('search');
        }
      }, 4500);

      // Step 2: Add to meal plan (when recipes are found)
      if (suggestions.length > 0 && !onboarding.steps.addToMeal) {
        toast(
          <div className="flex flex-col">
            <span>Found some recipes! Click the + button to add one to your meal</span>
          </div>,
          { duration: 4000 }
        );
        completeOnboardingStep('addToMeal');
      }

      // Step 3: Adjust servings (when meal has recipes)
      if (currentMeal.recipes.length > 0 && !onboarding.steps.adjustServings) {
        toast(
          <div className="flex flex-col">
            <span>Great choice! Try asking "adjust for 6 people"</span>
            <span className="text-sm text-gray-500 mt-1">You can adjust servings anytime</span>
          </div>,
          { duration: 4000 }
        );
        completeOnboardingStep('adjustServings');
      }

      // Step 4: Generate shopping list
      if (currentMeal.recipes.length > 0 && !onboarding.steps.shoppingList) {
        setTimeout(() => {
          toast(
            <div className="flex flex-col">
              <span>Ready to cook? Get your shopping list!</span>
              <span className="text-sm text-gray-500 mt-1">Click "Get Shopping List" above</span>
            </div>,
            { duration: 4000 }
          );
          completeOnboardingStep('shoppingList');
        }, 4000);
      }

      // Step 5: Start cooking
      if (currentMeal.recipes.length > 0 && !onboarding.steps.cookingMode) {
        setTimeout(() => {
          toast(
            <div className="flex flex-col">
              <span>All set? Let's start cooking!</span>
              <span className="text-sm text-gray-500 mt-1">Click "Start Cooking" to begin</span>
            </div>,
            { duration: 4000 }
          );
          completeOnboardingStep('cookingMode');
        }, 8000);
      }
    };

    showOnboardingStep();
    markOnboardingComplete();
  }, [
    onboarding,
    markOnboardingComplete,
    completeOnboardingStep,
    suggestions,
    currentMeal
  ]);

  return null;
}