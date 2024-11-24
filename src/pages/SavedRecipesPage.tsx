import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, Plus, Check, Heart } from 'lucide-react';
import { useStore } from '../store';
import { RecipeModal } from '../components/RecipeModal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Recipe } from '../types';

export function SavedRecipesPage() {
  const navigate = useNavigate();
  const { recipes, addToCurrentMeal, toggleFavorite, filteredRecipes, setCurrentRecipe, currentRecipe } = useStore();
  const [addedRecipes, setAddedRecipes] = useState<Record<string, boolean>>({});
  
  const savedRecipes = (filteredRecipes.length ? filteredRecipes : recipes).filter(recipe => recipe.favorite);

  const handleAddToMeal = (recipe: Recipe) => {
    addToCurrentMeal(recipe);
    setAddedRecipes(prev => ({ ...prev, [recipe.id]: true }));
    setTimeout(() => {
      setAddedRecipes(prev => ({ ...prev, [recipe.id]: false }));
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Saved Recipes</h1>
        </div>
      </div>

      <div className="content-container">
        <div className="max-w-3xl mx-auto py-6">
          {savedRecipes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No saved recipes yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Save recipes you love to find them easily later
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {savedRecipes.map((recipe: Recipe) => (
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
          )}
        </div>
      </div>

      {currentRecipe && <RecipeModal onClose={() => setCurrentRecipe(null)} />}
    </div>
  );
}