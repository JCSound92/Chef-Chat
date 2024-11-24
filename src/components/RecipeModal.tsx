import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Utensils, Clock, Users } from 'lucide-react';
import { useStore } from '../store';
import toast from 'react-hot-toast';

interface RecipeModalProps {
  onClose: () => void;
}

export function RecipeModal({ onClose }: RecipeModalProps) {
  const { currentRecipe, toggleFavorite, addToCurrentMeal } = useStore();

  if (!currentRecipe) return null;

  const handleAddToMeal = () => {
    addToCurrentMeal(currentRecipe);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="absolute inset-4 md:inset-20 bg-white rounded-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-100 p-6">
              <div className="flex items-center gap-4 mb-6">
                <Utensils className="w-12 h-12 text-[#e05f3e]" />
                <h1 className="text-4xl font-bold text-gray-900">{currentRecipe.title}</h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">
                    Serves {currentRecipe.currentServings || 4}
                  </span>
                </div>

                <button
                  onClick={handleAddToMeal}
                  className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
                >
                  Add to Tonight's Meal
                </button>

                <button
                  onClick={() => toggleFavorite(currentRecipe.id)}
                  className="p-3 hover:text-[#FF6B6B] transition-colors rounded-xl hover:bg-red-50"
                >
                  <Heart className={currentRecipe.favorite ? 'fill-[#982517] text-[#982517]' : ''} />
                </button>

                <button
                  onClick={onClose}
                  className="ml-auto p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Ingredients */}
                <div className="md:col-span-1">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Ingredients</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{currentRecipe.time} mins</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {currentRecipe.ingredients.map((ingredient, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-gray-700 py-1 border-b border-gray-200 last:border-0"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#e05f3e]" />
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Steps */}
                <div className="md:col-span-2">
                  <h2 className="text-xl font-bold mb-6">Instructions</h2>
                  <ol className="space-y-6">
                    {currentRecipe.steps.map((step, index) => (
                      <li key={index} className="flex gap-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e05f3e] text-white flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}