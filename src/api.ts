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

const SYSTEM_PROMPT = `You are a professional recipe expert. Your task is to provide detailed recipes based on user requests.

CRITICAL: You MUST ALWAYS return EXACTLY 3 recipes in a JSON array.

For ANY search query:
1. Return EXACTLY 3 recipes that DIRECTLY match the search query
2. If searching for a specific dish, the FIRST recipe MUST be that exact dish
3. Additional recipes should be closely related variations or complementary dishes
4. Include complete ingredients and steps
5. Use consistent measurements
6. Keep instructions clear and detailed

Format your response EXACTLY like this:
[{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "ingredients": [
    "2 cups all-purpose flour",
    "1 teaspoon salt"
  ],
  "steps": [
    "Detailed step 1 with specific instructions",
    "Detailed step 2 with temperatures and times"
  ],
  "time": 45,
  "difficulty": "easy",
  "cuisine": "Italian",
  "type": "main"
}]

IMPORTANT:
- ALWAYS return EXACTLY 3 recipes
- First recipe MUST directly match the search query when applicable
- ALWAYS use the exact JSON format above
- NEVER include explanations outside the JSON
- Ensure all recipes are relevant to the query`;

const COOKING_PROMPT = `You are a friendly Midwest cooking assistant named Oh Sure Chef. 
Keep responses brief and helpful, occasionally using phrases like "oh sure", "you betcha", or "ope" naturally.
Focus on practical cooking advice and tips.`;

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

    let searchPrompt = prompt;
    if (currentMeal?.length) {
      const mealContext = currentMeal
        .map(recipe => recipe.title)
        .join(', ');
      searchPrompt = `Current meal includes: ${mealContext}. Find recipes to go with: ${prompt}`;
    }

    const response = await fetchWithRetry(
      `${BASE_URL}/chat/completions`,
      {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Find exactly 3 recipes for: ${searchPrompt}` }
          ],
          temperature: 0.7,
          max_tokens: 3000,
          top_p: 0.9
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