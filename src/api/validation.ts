import type { Recipe } from '../types';

export function validateRecipe(recipe: any): recipe is Recipe {
  if (!recipe || typeof recipe !== 'object') return false;

  const required = [
    'title',
    'ingredients',
    'steps',
    'time',
    'difficulty',
    'cuisine',
    'type'
  ];

  for (const field of required) {
    if (!(field in recipe)) return false;
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return false;
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    return false;
  }

  if (typeof recipe.time !== 'number' || recipe.time <= 0) {
    return false;
  }

  return true;
}