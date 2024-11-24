import { Recipe } from './types';

const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const BASE_URL = 'https://api.perplexity.ai';

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
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
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
          'Authorization': `Bearer ${API_KEY}`,
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
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from API');
    }
    
    const recipesData = JSON.parse(jsonMatch[0]);
    
    return recipesData.map((recipe: any) => ({
      ...recipe,
      id: `${Date.now()}-${Math.random()}`,
      favorite: false,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch recipes';
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
          'Authorization': `Bearer ${API_KEY}`,
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
    return data.choices[0].message.content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get cooking advice';
    throw new Error(`Cooking advice failed: ${message}`);
  }
}