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
}]

Guidelines for steps:
- Break down complex processes into multiple smaller steps
- Include specific measurements, temperatures, and times
- Describe visual cues and texture changes
- Explain techniques in detail (e.g., "dice the onion into 1/4-inch pieces" instead of just "dice onion")
- Include safety tips and common mistakes to avoid
- Add helpful tips about ingredient substitutions or variations
- Describe what each step should look like when completed correctly
- Keep each step focused on a single task
- Use clear, specific language avoiding vague terms`;

const COOKING_PROMPT = `You are a friendly Midwest cooking assistant named Oh Sure Chef. 
Keep responses brief and helpful, occasionally using phrases like "oh sure", "you betcha", or "ope" naturally.
Focus on practical cooking advice and tips.`;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  backoff = 1000
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
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
}

export async function suggestRecipes(
  prompt: string,
  model = 'llama-3.1-70b-instruct'
): Promise<Recipe[]> {
  if (!API_KEY) {
    throw new Error('API key is missing');
  }

  try {
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
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }
    
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('No valid recipe data found in response');
    }
    
    const recipesData = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(recipesData) || recipesData.length === 0) {
      throw new Error('No recipes found');
    }
    
    return recipesData.map((recipe: any) => ({
      ...recipe,
      id: `${Date.now()}-${Math.random()}`,
      favorite: false,
    }));
  } catch (error) {
    console.error('API Error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to get recipes');
  }
}

export async function getCookingAdvice(
  question: string,
  recipe: Recipe
): Promise<string> {
  if (!API_KEY) {
    throw new Error('API key is missing');
  }

  try {
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
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('API Error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to get cooking advice');
  }
}