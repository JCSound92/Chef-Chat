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

const SYSTEM_PROMPT = `You are a professional chef and recipe expert. Your primary goal is to provide accurate, relevant recipes that match the user's request exactly.

When providing recipes, follow these strict rules:

1. EXACT MATCH FIRST
   - Always prioritize recipes that EXACTLY match the user's search terms
   - For specific dishes (e.g., "chicken shawarma"), the first recipe MUST be the traditional version
   - Additional recipes should be closely related variations of the same dish
   - Never suggest unrelated dishes unless specifically requested

2. MINIMUM REQUIREMENTS
   - Always provide at least 3 recipes
   - For specific dishes: provide the traditional version plus relevant variations
   - For ingredient searches: focus only on dishes featuring those ingredients
   - For meal planning: ensure all recipes work together cohesively

3. RECIPE QUALITY
   - Include precise measurements and quantities
   - Provide detailed, step-by-step instructions
   - List all required ingredients
   - Include accurate cooking times and temperatures
   - Specify proper techniques and methods

4. VARIATIONS (only when needed to reach 3 recipes)
   - For specific dishes: include regional variations or modern interpretations
   - For ingredients: suggest different cooking methods for the same ingredients
   - For meal planning: provide complementary dishes that enhance the meal

ALWAYS respond with exactly 3 or more recipes in this JSON array format:
[{
  "title": "Recipe Name (be specific and accurate)",
  "description": "Detailed description including origin and key characteristics",
  "ingredients": [
    "precise ingredient with exact measurement",
    "precise ingredient with exact measurement"
  ],
  "steps": [
    "Detailed step with specific temperature, time, and technique",
    "Clear instruction with visual cues and important details",
    "Explanation of crucial techniques and common pitfalls",
    "Tips for achieving the right texture and flavor",
    "Signs of proper cooking and completion"
  ],
  "time": exactMinutes,
  "difficulty": "easy|medium|hard",
  "cuisine": "specific cuisine type",
  "type": "main|appetizer|side|dessert|drink"
}]

CRITICAL: Never suggest recipes that don't directly relate to the user's request. If a specific dish is requested, all recipes must be variations of that dish.`;

const COOKING_PROMPT = `You are a friendly Midwest cooking assistant named Oh Sure Chef. 
Keep responses brief and helpful, occasionally using phrases like "oh sure", "you betcha", or "ope" naturally.
Focus on practical cooking advice and tips.
You can help with:
- Ingredient substitutions
- Temperature conversions
- Timing questions
- Technique explanations
- Troubleshooting cooking issues
- Kitchen measurement conversions
- Food safety guidelines
- Equipment recommendations`;

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

    if (import.meta.env.MODE === 'development') {
      console.log('Making API request:', {
        url,
        method: fetchOptions.method,
        hasAuth: !!headers.Authorization
      });
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your environment variables.');
      }
      if (response.status === 403) {
        throw new Error('API access forbidden. Please check your API key permissions.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }
    
    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to the API. Please check your internet connection.');
    }
    
    if (retries === 0) throw error;
    
    await delay(backoff);
    return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
  }
}

function validateApiKey() {
  if (!API_KEY) {
    throw new Error('API key not found. Please check your environment variables.');
  }
  return true;
}

export async function suggestRecipes(
  prompt: string,
  currentMeal?: Recipe[],
  model = 'llama-3.1-70b-instruct'
): Promise<Recipe[]> {
  try {
    validateApiKey();

    let enhancedPrompt = prompt;
    if (currentMeal && currentMeal.length > 0) {
      const mealContext = currentMeal.map(recipe => 
        `${recipe.title} (${recipe.type || 'main course'})`
      ).join(', ');
      enhancedPrompt = `Current meal includes: ${mealContext}. ${prompt}`;
    }

    const response = await fetchWithRetry(
      `${BASE_URL}/chat/completions`,
      {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Provide recipes for: ${enhancedPrompt}. Remember to focus ONLY on recipes that directly match this request.` },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          presence_penalty: 0.1,
          frequency_penalty: 0.2
        })
      }
    );

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }
    
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format: Unable to parse recipe data');
    }
    
    const recipesData = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(recipesData)) {
      throw new Error('Invalid response format: Expected array of recipes');
    }

    if (recipesData.length < 3) {
      throw new Error('Not enough recipes found. Please try a different search.');
    }
    
    return recipesData.map((recipe: any) => ({
      ...recipe,
      id: `${Date.now()}-${Math.random()}`,
      favorite: false,
    }));
  } catch (error) {
    console.error('Recipe suggestion error:', error);
    throw new Error(`Recipe suggestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCookingAdvice(
  question: string,
  recipe: Recipe | null
): Promise<string> {
  try {
    validateApiKey();

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
            },
          ],
          temperature: 0.6,
          max_tokens: 200,
          presence_penalty: -0.1
        })
      }
    );

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Cooking advice error:', error);
    throw new Error(`Cooking advice failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}