import React from 'react';
import { Heart, Utensils, List, ShoppingCart, Plus, Check, Users } from 'lucide-react';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function RecipeView() {
  const {
    currentRecipe,
    toggleFavorite,
    addToShoppingList,
    currentMeal,
    addToCurrentMeal
  } = useStore();

  if (!currentRecipe?.steps?.length || !currentRecipe?.ingredients?.length) {
    return null;
  }

  const isInMeal = currentMeal.recipes.some(recipe => recipe.id === currentRecipe.id);

  const handleAddToShoppingList = () => {
    addToShoppingList(currentRecipe.ingredients, currentRecipe.id);
    toast.success('Added ingredients to shopping list');
  };

  const handleAddToMeal = () => {
    addToCurrentMeal(currentRecipe);
    toast.success('Added to tonight\'s meal');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] p-8">
      <div className="max-w-3xl mx-auto">
        {/* Recipe Header */}
        <div className="card mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Utensils className="w-12 h-12 text-[#e05f3e]" />
            <h1 className="text-4xl font-bold text-gray-900">{currentRecipe.title}</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Serving Size Indicator */}
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">
                Serves {currentRecipe.currentServings || 4}
              </span>
            </div>

            {/* Add to Meal Button or Status */}
            {currentMeal.status === 'building' && !isInMeal ? (
              <button
                onClick={handleAddToMeal}
                className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Add to Tonight's Meal
              </button>
            ) : isInMeal && (
              <div className="flex items-center gap-2 text-[#4CAF50] bg-green-50 px-4 py-2 rounded-xl">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Added to Meal</span>
              </div>
            )}

            {/* Shopping List Button */}
            <button
              onClick={handleAddToShoppingList}
              className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to List
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite(currentRecipe.id)}
              className="p-3 hover:text-[#982517] transition-colors rounded-xl hover:bg-red-50"
            >
              <Heart className={currentRecipe.favorite ? 'fill-[#982517] text-[#982517]' : ''} />
            </button>
          </div>
        </div>

        {/* Recipe Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ingredients Panel */}
          <div className="md:col-span-1">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Ingredients
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{currentRecipe.time} mins</span>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.ul 
                  key={`${currentRecipe.id}-${currentRecipe.currentServings}`}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentRecipe.ingredients.map((ingredient, index) => (
                    <motion.li
                      key={`${ingredient}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 text-gray-700 py-1 border-b border-gray-100 last:border-0"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#e05f3e]" />
                      {ingredient}
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
          </div>

          {/* Steps Panel */}
          <div className="md:col-span-2">
            <div className="card">
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
    </div>
  );
}