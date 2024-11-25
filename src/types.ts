export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  steps: string[];
  time: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  favorite: boolean;
  type?: 'main' | 'side' | 'appetizer' | 'dessert' | 'drink';
  prepSteps?: string[];
  originalIngredients?: string[];
  currentServings?: number;
}

export interface CurrentMeal {
  recipes: Recipe[];
  status: 'building' | 'shopping' | 'cooking';
  servings: number;
  originalRecipes: Recipe[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  recipeId: string | null;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  message: string;
  type: 'user' | 'chef';
  timestamp: Date;
}

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  steps: {
    search: boolean;
    addToMeal: boolean;
    adjustServings: boolean;
    shoppingList: boolean;
    cookingMode: boolean;
  };
}

export interface VoiceState {
  isListening: boolean;
  error: string | null;
  transcript: string;
}

export interface MealPlan {
  id: string;
  name: string;
  recipes: Recipe[];
  createdAt: Date;
}

export interface AppState {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  suggestions: Recipe[];
  lastSearch: string;
  searchMode: 'plan' | 'recipe' | 'ingredients';
  currentRecipe: Recipe | null;
  currentStep: number;
  isTimerActive: boolean;
  timerSeconds: number;
  isCooking: boolean;
  showMenu: boolean;
  showRecipePanel: boolean;
  shoppingList: ShoppingListItem[];
  isLoading: boolean;
  chatMode: boolean;
  chatHistory: ChatMessage[];
  lastRecipeRequest: string;
  currentMeal: CurrentMeal;
  onboarding: OnboardingState;
  voiceState: VoiceState;
  mealPlans: MealPlan[];

  // Actions
  setIsLoading: (loading: boolean) => void;
  setSuggestions: (recipes: Recipe[], searchQuery?: string, append?: boolean) => void;
  setSearchMode: (mode: 'plan' | 'recipe' | 'ingredients') => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  toggleFavorite: (recipeId: string) => void;
  adjustPortions: (servings: number) => void;
  adjustMealPortions: (servings: number) => void;
  addToCurrentMeal: (recipe: Recipe) => void;
  removeFromCurrentMeal: (recipeId: string) => void;
  clearCurrentMeal: () => void;
  startCooking: () => void;
  generateShoppingList: () => void;
  addToShoppingList: (items: string[], recipeId?: string | null) => void;
  removeFromShoppingList: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
  clearCompletedItems: () => void;
  clearShoppingList: () => void;
  setShowMenu: (show: boolean) => void;
  setShowRecipePanel: (show: boolean) => void;
  filterRecipes: (query: string) => void;
  setChatMode: (mode: boolean) => void;
  addChatMessage: (message: string, type: 'user' | 'chef') => void;
  clearChatHistory: () => void;
  clearSearch: () => void;
  markOnboardingComplete: () => void;
  completeOnboardingStep: (step: keyof OnboardingState['steps']) => void;
  startTimer: (minutes: number) => void;
  stopTimer: () => void;
  decrementTimer: () => void;
  setVoiceState: (state: Partial<VoiceState>) => void;
  nextStep: () => void;
  previousStep: () => void;
  createMealPlan: (name: string) => void;
  deleteMealPlan: (id: string) => void;
  setCurrentMealPlan: (plan: MealPlan | null) => void;
  removeRecipeFromMealPlan: (planId: string, recipeId: string) => void;
  addMealPlanToShoppingList: (planId: string) => void;
}