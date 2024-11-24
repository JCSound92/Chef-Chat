import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Utensils, Calendar, Trash2 } from 'lucide-react';
import { useStore } from '../store';

export function MealPlansPage() {
  const navigate = useNavigate();
  const { mealPlans, createMealPlan, deleteMealPlan } = useStore();
  const [showNewPlanInput, setShowNewPlanInput] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlanName.trim()) {
      createMealPlan(newPlanName.trim());
      setNewPlanName('');
      setShowNewPlanInput(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Meal Plans</h1>
        </div>
        <button
          onClick={() => setShowNewPlanInput(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Plan
        </button>
      </div>

      {showNewPlanInput && (
        <form onSubmit={handleCreatePlan} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="Enter plan name..."
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent"
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              Create Plan
            </button>
            <button
              type="button"
              onClick={() => setShowNewPlanInput(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mealPlans.length === 0 ? (
        <div className="text-center py-12">
          <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No meal plans yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Create a plan to organize your recipes
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {mealPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/meal-plan/${plan.id}`)}
                >
                  <h3 className="text-xl font-medium group-hover:text-[#FF6B6B] transition-colors">
                    {plan.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Utensils className="w-4 h-4" />
                      <span>{plan.recipes.length} recipes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteMealPlan(plan.id)}
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
  );
}