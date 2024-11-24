import { Recipe } from './types';

const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const BASE_URL = 'https://api.perplexity.ai';

// Debug check for environment variables
if (import.meta.env.MODE === 'production') {
  console.log('API Environment Check:', {
    hasApiKey: !!API_KEY,
    apiKeyLength: API_KEY?.length || 0,
    mode: import.meta.env.MODE,
    baseUrl: BASE_URL
  });
}

const SYSTEM_PROMPT = `You are a friendly Midwest cooking assistant who helps users find recipes. 
When suggesting multiple recipes, respond with a JSON array of recipes in this format:
[{
  "title": "Recipe Name",
  "description": "Brief description",
  "ingredients": ["ingredient1 with exact measurement", "ingredient2 with exact measurement"],
  "steps": [
    "Very detailed step with specific instructions about technique",
    "Break down complex steps into smaller, more manageable steps",
    "Include precise temperatures, times, and visual cues",
    "Explain why certain techniques are important",
    "Include helpful tips and common mistakes to avoid",
    "Describe what the result should look like"
  ],
  "time": estimatedMinutes,
  "difficulty": "easy|medium|hard",
  "cuisine": "cuisine type"
}]`;

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
    // Add CORS mode and credentials
    const fetchOptions: RequestInit = {
      ...options,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

    // Log the request details in production for debugging
    if (import.meta.env.MODE === 'production') {
      console.log('API Request:', {
        url,
        hasAuthHeader: !!fetchOptions.headers?.['Authorization'],
        method: fetchOptions.method,
        mode: fetchOptions.mode,
        headers: Object.keys(fetchOptions.headers || {})
      });
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        hasApiKey: !!API_KEY,
        responseHeaders: Object.fromEntries(response.headers.entries())
      });
      
      // Handle specific error cases
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
    console.error('Fetch Error Details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!API_KEY,
      mode: import.meta.env.MODE,
      url: BASE_URL
    });

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the API. This might be due to CORS restrictions or network issues. Please try again.');
    }
    
    if (retries === 0) throw error;
    
    await delay(backoff);
    return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
  }
}

function validateApiKey() {
  if (!API_KEY) {
    console.error('API Key Validation Failed:', {
      hasKey: false,
      mode: import.meta.env.MODE,
      envVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    });
    throw new Error('API key not found. Please check your environment variables in Netlify.');
  }
  
  if (API_KEY === 'your_api_key_here') {
    throw new Error('Please replace the default API key with your actual Perplexity API key.');
  }
  
  return true;
}

export async function suggestRecipes(
  prompt: string,
  model = 'llama-3.1-70b-instruct'
): Promise<Recipe[]> {
  try {
    validateApiKey();

    const response = await fetchWithRetry(
      `${BASE_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Suggest 3 recipes for: ${prompt}` },
          ],
          temperature: 0.6,
          max_tokens: 2000,
          presence_penalty: -0.1,
          frequency_penalty: 0.1,
        }),
      }
    );

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid API Response:', data);
      throw new Error('Invalid API response format. Missing required data.');
    }
    
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('Invalid Response Content:', content);
      throw new Error('Invalid response format: Unable to parse recipe data.');
    }
    
    const recipesData = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(recipesData) || recipesData.length === 0) {
      throw new Error('No recipes found in the API response.');
    }
    
    return recipesData.map((recipe: any) => ({
      ...recipe,
      id: `${Date.now()}-${Math.random()}`,
      favorite: false,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Recipe suggestion error:', {
      error: message,
      hasApiKey: !!API_KEY,
      mode: import.meta.env.MODE,
      url: BASE_URL
    });
    throw new Error(`Recipe suggestion failed: ${message}`);
  }
}

export async function getCookingAdvice(
  question: string,
  recipe: Recipe
): Promise<string> {
  try {
    validateApiKey();

    const response = await fetchWithRetry(
      `${BASE_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-instruct',
          messages: [
            { role: 'system', content: COOKING_PROMPT },
            { role: 'user', content: `I'm cooking ${recipe.title}. ${question}` },
          ],
          temperature: 0.6,
          max_tokens: 200,
          presence_penalty: -0.1,
          frequency_penalty: 0.1,
        }),
      }
    );

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid API Response:', data);
      throw new Error('Invalid API response format. Missing required data.');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Cooking advice error:', {
      error: message,
      hasApiKey: !!API_KEY,
      mode: import.meta.env.MODE,
      url: BASE_URL
    });
    throw new Error(`Cooking advice failed: ${message}`);
  }
}