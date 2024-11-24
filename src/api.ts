import { Recipe } from './types';

const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const BASE_URL = 'https://api.perplexity.ai';

// Fallback recipes for when API is unavailable
const FALLBACK_RECIPES = [
  {
    id: '1',
    title: 'Classic Spaghetti Carbonara',
    description: 'A creamy Italian pasta dish with eggs, cheese, pancetta, and black pepper',
    ingredients: [
      '1 pound spaghetti',
      '4 large eggs',
      '1 cup freshly grated Pecorino Romano',
      '4 oz pancetta or guanciale, diced',
      '2 cloves garlic, minced',
      'Fresh ground black pepper',
      'Salt to taste'
    ],
    steps: [
      'Bring a large pot of salted water to boil and cook spaghetti according to package directions',
      'While pasta cooks, whisk eggs and cheese in a bowl',
      'Cook pancetta in a large pan until crispy, about 5 minutes',
      'Add garlic to pancetta and cook for 1 minute',
      'Reserve 1 cup pasta water, then drain pasta',
      'Working quickly, add hot pasta to pancetta pan',
      'Remove from heat and stir in egg mixture, tossing quickly',
      'Add pasta water as needed for creamy sauce',
      'Season generously with black pepper'
    ],
    time: 30,
    difficulty: 'medium',
    cuisine: 'Italian',
    favorite: false
  },
  {
    id: '2',
    title: 'Quick Chicken Stir-Fry',
    description: 'A versatile weeknight dinner with tender chicken and crisp vegetables',
    ingredients: [
      '1 pound chicken breast, sliced',
      '2 cups mixed vegetables',
      '3 tablespoons soy sauce',
      '1 tablespoon sesame oil',
      '2 cloves garlic, minced',
      '1 inch ginger, grated',
      '2 tablespoons vegetable oil'
    ],
    steps: [
      'Slice chicken into thin strips',
      'Heat vegetable oil in a large wok or skillet over high heat',
      'Add chicken and cook until golden, about 5-6 minutes',
      'Remove chicken and set aside',
      'Add vegetables to the pan and stir-fry for 3-4 minutes',
      'Return chicken to pan',
      'Add soy sauce, sesame oil, garlic, and ginger',
      'Stir-fry everything together for 2-3 minutes',
      'Serve hot over rice'
    ],
    time: 25,
    difficulty: 'easy',
    cuisine: 'Asian',
    favorite: false
  }
];

// Fallback cooking advice responses
const FALLBACK_ADVICE = [
  "Oh sure! For best results, make sure all your ingredients are at room temperature before starting.",
  "You betcha! Remember to taste and adjust seasonings as you go.",
  "Ope! Don't forget to let meat rest for a few minutes before cutting.",
  "A good tip is to prep all your ingredients before you start cooking.",
  "Make sure your pan is nice and hot before adding the ingredients.",
  "Keep an eye on the temperature - if things are browning too quickly, just turn down the heat a bit."
];

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
    console.warn('API key not found, using fallback responses');
    return false;
  }
  return true;
}

export async function suggestRecipes(
  prompt: string,
  model = 'llama-3.1-70b-instruct'
): Promise<Recipe[]> {
  try {
    if (!validateApiKey()) {
      // Filter fallback recipes based on the prompt
      const searchTerms = prompt.toLowerCase().split(' ');
      const filteredRecipes = FALLBACK_RECIPES.filter(recipe => {
        const searchText = `${recipe.title} ${recipe.description} ${recipe.cuisine}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });
      
      // Return at least one recipe even if no matches
      const recipesToReturn = filteredRecipes.length > 0 ? filteredRecipes : [FALLBACK_RECIPES[0]];
      return recipesToReturn.map(recipe => ({
        ...recipe,
        id: `${Date.now()}-${Math.random()}`,
      }));
    }

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
      throw new Error('No valid JSON found in response');
    }
    
    const recipesData = JSON.parse(jsonMatch[0]);
    
    return recipesData.map((recipe: any) => ({
      ...recipe,
      id: `${Date.now()}-${Math.random()}`,
      favorite: false,
    }));
  } catch (error) {
    console.error('API Error:', error);
    // Return filtered fallback recipes on error
    const searchTerms = prompt.toLowerCase().split(' ');
    const filteredRecipes = FALLBACK_RECIPES.filter(recipe => {
      const searchText = `${recipe.title} ${recipe.description} ${recipe.cuisine}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    });
    
    return (filteredRecipes.length > 0 ? filteredRecipes : [FALLBACK_RECIPES[0]])
      .map(recipe => ({
        ...recipe,
        id: `${Date.now()}-${Math.random()}`,
      }));
  }
}

export async function getCookingAdvice(
  question: string,
  recipe: Recipe
): Promise<string> {
  try {
    if (!validateApiKey()) {
      return FALLBACK_ADVICE[Math.floor(Math.random() * FALLBACK_ADVICE.length)];
    }

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
    console.error('API Error:', error);
    return FALLBACK_ADVICE[Math.floor(Math.random() * FALLBACK_ADVICE.length)];
  }
}