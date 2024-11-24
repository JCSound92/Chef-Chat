import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, Play, Users } from 'lucide-react';
import { useStore } from '../store';
import { RecipeModal } from './RecipeModal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onRemove: (id: string) => void;
  index: number;
  servings: number;
}

function RecipeCard({ recipe, onRemove, index, servings }: RecipeCardProps) {
  const { setCurrentRecipe } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => setCurrentRecipe(recipe)}
        >
          <h3 className="text-lg font-medium group-hover:text-[#FF6B6B] transition-colors">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="text-gray-500 text-sm mt-1">
              {recipe.description}
            </p>
          )}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`ingredients-${recipe.id}-${servings}-${index}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-1"
            >
              {recipe.ingredients.map((ingredient: string, idx: number) => (
                <motion.p 
                  key={`ingredient-${recipe.id}-${idx}-${servings}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="text-sm text-gray-600 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" />
                  {ingredient}
                </motion.p>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(recipe.id);
          }}
          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

export function CurrentMeal() {
  const navigate = useNavigate();
  const { 
    currentMeal, 
    removeFromCurrentMeal, 
    clearCurrentMeal,
    generateShoppingList,
    startCooking,
    currentRecipe,
    setCurrentRecipe
  } = useStore();

  const handleGenerateList = () => {
    generateShoppingList();
    navigate('/shopping-list');
    toast.success('Shopping list generated!');
  };

  const handleStartCooking = () => {
    startCooking();
    navigate('/cooking');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-8 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Tonight's Meal</h1>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">
                Serves {currentMeal.servings}
              </span>
            </div>
          </div>
          
          {currentMeal.recipes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGenerateList}
                className="btn btn-secondary flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Get Shopping List
              </button>
              <button
                onClick={handleStartCooking}
                className="btn btn-primary flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Cooking
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="content-container">
        <div className="max-w-3xl mx-auto py-6">
          {currentMeal.recipes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500">No recipes added yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Add recipes to plan tonight's meal
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={`meal-${currentMeal.servings}-${currentMeal.recipes.length}`}
                className="grid gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentMeal.recipes.map((recipe, index) => (
                  <RecipeCard
                    key={`recipe-${recipe.id}-${currentMeal.servings}-${index}`}
                    recipe={recipe}
                    onRemove={removeFromCurrentMeal}
                    index={index}
                    servings={currentMeal.servings}
                  />
                ))}

                <button
                  onClick={clearCurrentMeal}
                  className="w-full py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-4"
                >
                  Clear All
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {currentRecipe && <RecipeModal onClose={() => setCurrentRecipe(null)} />}
    </div>
  );
}