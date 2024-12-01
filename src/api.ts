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

const SYSTEM_PROMPT = `You are a professional chef and recipe expert. Your primary task is to provide detailed recipes that match the user's request.

ALWAYS follow these rules:
1. Return EXACTLY 3 recipes for every request
2. For specific dish requests (e.g. "chicken shawarma"):
   - First recipe MUST be the exact traditional version
   - Include 2 popular variations
   - All recipes must directly relate to the main dish
3. For ingredient-based searches:
   - All recipes must use the specified ingredients
   - Provide diverse cooking methods
4. For meal planning:
   - Ensure recipes complement each other
   - Consider balanced nutrition

Format ALL responses as a JSON array with EXACTLY 3 recipes:
[{
  "title": "Recipe Name (be specific)",
  "description": "2-3 sentence description of dish origin and taste",
  "ingredients": [
    "precise measurements (e.g. '2 cups all-purpose flour')",
    "exact quantities for every ingredient"
  ],
  "steps": [
    "numbered steps with exact temperatures and times",
    "specific techniques and visual cues",
    "clear instructions for each action"
  ],
  "time": exactMinutesAsNumber,
  "difficulty": "easy|medium|hard",
  "cuisine": "specific cuisine type",
  "type": "main|appetizer|side|dessert|drink"
}]`;

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
    console.error('Fetch error:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to the API. Please check your internet connection.');
    }
    
    if (retries === 0) throw error;
    
    console.log(`Retrying request... (${retries} attempts remaining)`);
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

    console.log('Sending recipe request:', enhancedPrompt);

    const response = await fetchWithRetry(
      `${BASE_URL}/chat/completions`,
      {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Find exactly 3 recipes for: ${enhancedPrompt}` },
          ],
          temperature: 0.3,
          max_tokens: 4000,
          top_p: 0.9,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      }
    );

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid API response:', data);
      throw new Error('Invalid API response format');
    }
    
    const content = data.choices[0].message.content;
    console.log('Raw API response:', content);

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format: Unable to parse recipe data');
    }
    
    try {
      const recipesData = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(recipesData)) {
        throw new Error('Response is not an array');
      }

      if (recipesData.length === 0) {
        throw new Error('No recipes found in response');
      }

      const recipes = recipesData.map((recipe: any) => ({
        ...recipe,
        id: `${Date.now()}-${Math.random()}`,
        favorite: false,
      }));

      console.log('Processed recipes:', recipes);
      return recipes;

    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0]);
      throw new Error('Failed to parse recipe data');
    }
  } catch (error) {
    console.error('Recipe suggestion error:', error);
    throw error;
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