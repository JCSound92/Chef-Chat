import { Recipe } from './types';

const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const BASE_URL = 'https://api.perplexity.ai';

// Debug check for environment variables
if (import.meta.env.MODE === 'development') {
  console.log('API Environment Check:', {
    hasApiKey: !!API_KEY,
    mode: import.meta.env.MODE,
    baseUrl: BASE_URL
  });
}

const RECIPE_SEARCH_PROMPT = `You are a professional chef specializing in recipe development. Your task is to provide detailed recipes based on specific requests.

CRITICAL: You MUST ALWAYS return EXACTLY 3 recipes in a JSON array.

When providing recipes for a specific dish:
- All 3 recipes MUST be variations of the requested dish
- Each variation should be unique but authentic to the cuisine
- Include regional or modern variations when appropriate
- Maintain the core elements that define the dish

Format your response EXACTLY like this:
[{
  "title": "Recipe Name",
  "description": "Brief description highlighting what makes this variation unique",
  "ingredients": ["exact measurements and ingredients"],
  "steps": ["detailed, numbered steps with specific techniques"],
  "time": estimatedMinutes,
  "difficulty": "easy|medium|hard",
  "cuisine": "cuisine type",
  "type": "main|appetizer|side|dessert|drink"
}]`;

const MEAL_PLANNING_PROMPT = `You are a professional meal planning expert. Your task is to suggest recipes that complement an existing meal plan.

CRITICAL: You MUST ALWAYS return EXACTLY 3 recipes in a JSON array.

When suggesting complementary dishes:
- Consider flavor profiles of existing dishes
- Balance the meal with appropriate portions and nutrition
- Ensure cooking times and difficulty levels are manageable
- Suggest dishes that can be prepared alongside the existing menu

Use the exact JSON format as specified.`;

const INGREDIENTS_PROMPT = `You are a creative chef specializing in working with available ingredients. Your task is to suggest recipes using only the provided ingredients.

CRITICAL: You MUST ALWAYS return EXACTLY 3 recipes in a JSON array.

When creating recipes from ingredients:
- Only use the ingredients listed (plus basic pantry staples)
- Create complete, satisfying dishes
- Vary the cooking methods and styles
- Ensure recipes are practical and achievable

Use the exact JSON format as specified.`;

const COOKING_PROMPT = `You are a professional chef providing cooking advice. Be concise, practical, and specific in your guidance.

When answering questions:
- Focus on technique and best practices
- Provide specific temperatures, times, and measurements
- Explain the reasoning behind your advice
- Keep responses clear and actionable`;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  backoff = 500
): Promise<Response> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...headers
      }
    };

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      if (response.status === 403) {
        throw new Error('API access forbidden');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      throw new Error(`API request failed: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    if (retries === 0) throw error;
    await delay(backoff);
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
}

function validateRecipe(recipe: any): recipe is Recipe {
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