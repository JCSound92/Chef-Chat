import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, ShoppingCart, Play, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import type { Recipe } from '../types';

export function MealPlanDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    mealPlans,
    setCurrentMealPlan,
    removeRecipeFromMealPlan,
    addMealPlanToShoppingList,
  } = useStore();

  const mealPlan = mealPlans.find((plan) => plan.id === id);

  useEffect(() => {
    if (mealPlan) {
      setCurrentMealPlan(mealPlan);
    } else {
      navigate('/meal-plans');
    }
    return () => setCurrentMealPlan(null);
  }, [mealPlan, setCurrentMealPlan, navigate]);

  if (!mealPlan) return null;

  const handleAddToShoppingList = () => {
    addMealPlanToShoppingList(mealPlan.id);
    navigate('/shopping-list');
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/meal-plans')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">{mealPlan.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToShoppingList}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to List
          </button>
          <button
            onClick={() => navigate(`/cooking/${mealPlan.id}`)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Cooking
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recipes</h2>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Recipe
          </button>
        </div>

        {mealPlan.recipes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">No recipes added yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Start by adding some recipes to your meal plan
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {mealPlan.recipes.map((recipe: Recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  >
                    <h3 className="text-lg font-medium hover:text-[#FF6B6B] transition-colors">
                      {recipe.title}
                    </h3>
                    {recipe.description && (
                      <p className="text-gray-500 text-sm mt-1">
                        {recipe.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeRecipeFromMealPlan(mealPlan.id, recipe.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}