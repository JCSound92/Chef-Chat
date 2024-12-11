// Recipe Types
export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  steps: string[];
  time: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  type: 'main' | 'appetizer' | 'side' | 'dessert' | 'drink';
  favorite: boolean;
  currentServings?: number;
}

// Shopping List Types
export interface ShoppingListItem {
  id: string;
  name: string;
  completed: boolean;
  recipeId?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  message: string;
  type: 'user' | 'chef';
  context: 'chef' | 'cooking';
  timestamp: number;
}

export interface ChatContexts {
  chef: ChatMessage[];
  cooking: ChatMessage | null;
}

// Search Types
export interface SearchHistoryEntry {
  query: string;
  mode: 'plan' | 'recipe' | 'ingredients';
  timestamp: number;
}

// Meal Types
export interface CurrentMeal {
  recipes: Recipe[];
  status: 'building' | 'cooking' | 'completed';
  servings: number;
  originalRecipes: Recipe[];
}

export interface MealPlan {
  id: string;
  name: string;
  recipes: Recipe[];
  createdAt: number;
}

// Cooking State Types
export interface CookingState {
  isActive: boolean;
  currentStepIndex: number;
  currentRecipeIndex: number;
}

// Voice Control Types
export interface VoiceState {
  isListening: boolean;
  error: string | null;
  transcript: string;
}

// Main App State Interface
export interface AppState {
  // Data
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  suggestions: Recipe[];
  shoppingList: ShoppingListItem[];
  mealPlans: MealPlan[];
  currentMeal: CurrentMeal;
  
  // UI State
  currentRecipe: Recipe | null;
  currentStep: number;
  isTimerActive: boolean;
  timerSeconds: number;
  isCooking: boolean;
  showMenu: boolean;
  showRecipePanel: boolean;
  isLoading: boolean;
  
  // Search & Chat State
  lastSearch: string;
  searchMode: 'plan' | 'recipe' | 'ingredients';
  chatMode: boolean;
  chatContexts: ChatContexts;
  lastRecipeRequest: string;
  searchHistory: SearchHistoryEntry[];
  
  // Cooking State
  cookingState: CookingState;
  
  // Voice State
  voiceState: VoiceState;

  // Actions
  setIsLoading: (loading: boolean) => void;
  setSuggestions: (recipes: Recipe[], searchQuery?: string, append?: boolean) => void;
  setSearchMode: (mode: 'plan' | 'recipe' | 'ingredients') => void;
  setChatMode: (mode: boolean) => void;
  clearSearch: () => void;
  restoreSearch: (query: string, mode: 'plan' | 'recipe' | 'ingredients') => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  toggleFavorite: (id: string) => void;
  addToCurrentMeal: (recipe: Recipe) => void;
  removeFromCurrentMeal: (id: string) => void;
  clearCurrentMeal: () => void;
  adjustPortions: (servings: number) => void;
  adjustMealPortions: (servings: number) => void;
  addToShoppingList: (ingredients: string[], recipeId?: string) => void;
  removeFromShoppingList: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
  clearShoppingList: () => void;
  clearCompletedItems: () => void;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  decrementTimer: () => void;
  startCooking: () => void;
  stopCooking: () => void;
  setCurrentStep: (step: number) => void;
  setCurrentRecipeIndex: (index: number) => void;
  filterRecipes: (query: string) => void;
  addChatMessage: (message: string, type: 'user' | 'chef', context: 'chef' | 'cooking') => void;
  clearChatHistory: (context: 'chef' | 'cooking') => void;
  generateShoppingList: () => void;
}