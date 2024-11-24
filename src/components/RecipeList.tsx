import React from 'react';
import { Clock, Heart } from 'lucide-react';
import { useStore } from '../store';
import type { Recipe } from '../types';

export function RecipeList() {
  const { recipes, setCurrentRecipe, toggleFavorite } = useStore();

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="fixed left-8 top-8 w-80 bg-white rounded-2xl shadow-xl p-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Recent Recipes</h2>
      <div className="space-y-4">
        {recipes.map((recipe: Recipe) => (
          <div
            key={recipe.id}
            className="group relative bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setCurrentRecipe(recipe)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900 group-hover:text-[#FF6B6B] transition-colors">
                {recipe.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(recipe.id);
                }}
                className="p-1 hover:text-[#FF6B6B] transition-colors rounded-lg hover:bg-white"
              >
                <Heart
                  className={`w-4 h-4 ${
                    recipe.favorite ? 'fill-[#FF6B6B] text-[#FF6B6B]' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              <span>{recipe.time} mins</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}