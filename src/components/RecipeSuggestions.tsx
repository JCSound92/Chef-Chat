import React, { useState } from 'react';
import { Clock, Plus, Check, Heart } from 'lucide-react';
import { useStore } from '../store';
import { RecipeModal } from './RecipeModal';
import { motion } from 'framer-motion';
import type { Recipe } from '../types';

interface RecipeSuggestionsProps {
  placeholderText?: string;
}

export function RecipeSuggestions({ placeholderText }: RecipeSuggestionsProps) {
  const { suggestions, addToCurrentMeal, toggleFavorite, setCurrentRecipe, currentRecipe } = useStore();
  const [addedRecipes, setAddedRecipes] = useState<Record<string, boolean>>({});

  const handleAddToMeal = (recipe: Recipe) => {
    addToCurrentMeal(recipe);
    setAddedRecipes(prev => ({ ...prev, [recipe.id]: true }));
    setTimeout(() => {
      setAddedRecipes(prev => ({ ...prev, [recipe.id]: false }));
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="content-container">
        <div className="max-w-3xl mx-auto py-6">
          <div className="grid gap-4">
            {suggestions.map((recipe: Recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative group"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setCurrentRecipe(recipe)}
                >
                  <h3 className="text-xl font-semibold text-[#333333] mb-2 group-hover:text-[#e05f3e] transition-colors pr-20">
                    {recipe.title}
                  </h3>
                  {recipe.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {recipe.description}
                    </p>
                  )}
                  <div className="flex items-center gap-8 text-sm text-[#666666]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.time} mins</span>
                    </div>
                    {recipe.cuisine && (
                      <span className="text-[#e05f3e]">{recipe.cuisine}</span>
                    )}
                  </div>
                </div>

                <motion.button
                  onClick={() => handleAddToMeal(recipe)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full shadow-md flex items-center justify-center text-white hover:scale-105 transition-transform"
                  animate={{
                    backgroundColor: addedRecipes[recipe.id] ? '#95cad4' : '#e05f3e',
                  }}
                >
                  <motion.div
                    animate={{ rotate: addedRecipes[recipe.id] ? 360 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {addedRecipes[recipe.id] ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </motion.div>
                </motion.button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(recipe.id);
                  }}
                  className="absolute bottom-4 right-4 p-2 text-[#982517] hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Heart className={recipe.favorite ? 'fill-[#982517]' : ''} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {currentRecipe && <RecipeModal onClose={() => setCurrentRecipe(null)} />}
    </div>
  );
}