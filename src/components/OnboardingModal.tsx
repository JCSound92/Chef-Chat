import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Search, Utensils, ShoppingCart, CookingPot } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';

const FEATURES = [
  {
    icon: Search,
    title: "Find Recipes",
    description: "Search for recipes by name, ingredients, or meal type"
  },
  {
    icon: Utensils,
    title: "Plan Your Meal",
    description: "Create complete meal plans with multiple courses"
  },
  {
    icon: ShoppingCart,
    title: "Shopping Lists",
    description: "Automatically generate shopping lists from your recipes"
  },
  {
    icon: CookingPot,
    title: "Cooking Mode",
    description: "Step-by-step instructions and timers while you cook"
  },
  {
    icon: ChefHat,
    title: "Ask Chef",
    description: "Get cooking advice and recipe suggestions"
  }
];

export function OnboardingModal() {
  const { hasSeenOnboarding, completeOnboarding } = useOnboarding();

  if (hasSeenOnboarding) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="m-4 md:m-20 bg-white rounded-2xl"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#e05f3e] rounded-xl flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Welcome to Chef Chat!</h2>
                  <p className="text-gray-500">Your personal cooking assistant</p>
                </div>
              </div>
              <button
                onClick={completeOnboarding}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#e05f3e] flex items-center justify-center flex-shrink-0">
                    {React.createElement(feature.icon, {
                      className: "w-5 h-5 text-white"
                    })}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={completeOnboarding}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}