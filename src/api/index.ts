import { Recipe } from '../types';
import { RECIPE_SEARCH_PROMPT, MEAL_PLANNING_PROMPT, INGREDIENTS_PROMPT, COOKING_PROMPT } from './prompts';
import { cleanCache, getCachedResponse, setCachedResponse } from './cache';
import { validateRecipe } from './validation';
import { fetchWithRetry, API_KEY, BASE_URL } from './client';

export async function suggestRecipes(
  prompt: string,
  currentMeal?: Recipe[],
  model = 'llama-3.1-70b-instruct'
): Promise<Recipe[]> {
  if (!prompt.trim()) {
    throw new Error('Search query cannot be empty');
  }

  try {
    if (!API_KEY) {
      throw new Error('API key is required');
    }

    // Clean old cache entries
    cleanCache();

    // Create a cache key that includes relevant context
    const cacheKey = JSON.stringify({
      prompt,
      currentMeal: currentMeal?.map(r => r.id),
      model
    });

    // Check cache first
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    // Determine the search mode based on the prompt and context
    let systemPrompt = RECIPE_SEARCH_PROMPT;
    let searchPrompt = prompt;

    const isIngredientSearch = prompt.includes(',') || /\b(got|have|using)\b/i.test(prompt);
    const isMealPlanSearch = (currentMeal && currentMeal.length > 0) || /\b(with|for|accompany|meal|dinner|lunch)\b/i.test(prompt);

    if (isIngredientSearch) {
      systemPrompt = INGREDIENTS_PROMPT;
      searchPrompt = `Create recipes using these ingredients: ${prompt}`;
    } else if (isMealPlanSearch && currentMeal && currentMeal.length > 0) {
      systemPrompt = MEAL_PLANNING_PROMPT;
      const mealContext = currentMeal
        .map(recipe => `${recipe.title} (${recipe.cuisine || 'various'} cuisine)`)
        .join(', ');
      searchPrompt = `Current meal includes: ${mealContext}. Suggest recipes that would complement these dishes: ${prompt}`;
    }

    const response = await fetchWithRetry(
      `${BASE_URL}/chat/completions`,
      {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: searchPrompt }
          ],
          temperature: 0.8,
          max_tokens: 3000,
          top_p: 0.95
        })
      }
    );

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response');
    }

    const content = data.choices[0].message.content;
    const match = content.match(/\[[\s\S]*\]/);
    
    if (!match) {
      throw new Error('No recipe data found in response');
    }

    let recipes: Recipe[];
    try {
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }
      recipes = parsed;
    } catch (e) {
      throw new Error('Failed to parse recipe data');
    }

    const validRecipes = recipes
      .filter(validateRecipe)
      .map(recipe => ({
        ...recipe,
        id: `${Date.now()}-${Math.random()}`,
        favorite: false
      }));

    if (validRecipes.length === 0) {
      throw new Error('No valid recipes found');
    }

    // Cache the valid response
    setCachedResponse(cacheKey, validRecipes);

    return validRecipes;
  } catch (error) {
    console.error('Recipe search failed:', error);
    throw error;
  }
}

export async function getCookingAdvice(
  question: string,
  recipe: Recipe | null
): Promise<string> {
  try {
    if (!API_KEY) {
      throw new Error('API key is required');
    }

    const response = await fetchWithRetry(
      `${BASE_URL}/chat/completions`,
      {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama-3.1-70b-instruct',
          messages: [
            { role: 'system', content: COOKING_PROMPT },
            { role: 'user', content: recipe 
              ? `I'm cooking ${recipe.title}. ${question}`
              : question 
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      }
    );

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Cooking advice failed:', error);
    throw error;
  }
}