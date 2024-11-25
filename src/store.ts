import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Recipe, ShoppingListItem } from './types';
import { parseIngredient, formatIngredient, consolidateIngredients } from './utils/ingredientParser';

const MAX_CHAT_HISTORY = 100; // Keep last 100 messages
const RECIPES_PER_PAGE = 3; // Number of recipes to fetch per request

const createSearchIndex = (recipe: Recipe): string => 
  `${recipe.title} ${recipe.description || ''} ${recipe.cuisine || ''} ${
    recipe.type || ''} ${recipe.ingredients.join(' ')}`.toLowerCase();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // State
      recipes: [],
      filteredRecipes: [],
      suggestions: [],
      lastSearch: '',
      searchMode: 'recipe' as const,
      currentRecipe: null,
      currentStep: 0,
      isTimerActive: false,
      timerSeconds: 0,
      isCooking: false,
      showMenu: false,
      showRecipePanel: false,
      shoppingList: [],
      isLoading: false,
      chatMode: false,
      chatHistory: [],
      lastRecipeRequest: '',
      currentMeal: {
        recipes: [],
        status: 'building',
        servings: 4,
        originalRecipes: []
      },
      onboarding: {
        hasCompletedOnboarding: false,
        steps: {
          search: false,
          addToMeal: false,
          adjustServings: false,
          shoppingList: false,
          cookingMode: false
        }
      },

      // Actions
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setSuggestions: (recipes, searchQuery = '', append = false) => set((state) => ({ 
        suggestions: append ? [...state.suggestions, ...recipes] : recipes,
        lastSearch: searchQuery || state.lastSearch,
        lastRecipeRequest: searchQuery || state.lastRecipeRequest
      })),
      
      setSearchMode: (mode) => set({ searchMode: mode }),
      setChatMode: (mode) => set({ chatMode: mode }),
      
      addChatMessage: (message, type) => set((state) => ({
        chatHistory: [
          ...state.chatHistory.slice(-MAX_CHAT_HISTORY),
          {
            id: `${Date.now()}-${Math.random()}`,
            message,
            type,
            timestamp: new Date()
          }
        ]
      })),

      clearChatHistory: () => set({ chatHistory: [] }),

      clearSearch: () => set({ 
        suggestions: [], 
        lastSearch: '',
        lastRecipeRequest: ''
      }),

      setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),

      toggleFavorite: (recipeId) => set((state) => ({
        recipes: state.recipes.map(r => 
          r.id === recipeId ? { ...r, favorite: !r.favorite } : r
        )
      })),

      adjustPortions: (servings) => set((state) => {
        if (!state.currentRecipe?.originalIngredients) return state;
        const ratio = servings / (state.currentRecipe.currentServings || 4);
        const updatedIngredients = state.currentRecipe.originalIngredients.map(ingredient => {
          const parsed = parseIngredient(ingredient);
          if (parsed) {
            parsed.amount *= ratio;
            return formatIngredient(parsed);
          }
          return ingredient;
        });

        return {
          currentRecipe: {
            ...state.currentRecipe,
            currentServings: servings,
            ingredients: updatedIngredients
          }
        };
      }),

      adjustMealPortions: (servings) => set((state) => {
        const ratio = servings / state.currentMeal.servings;
        const updatedRecipes = state.currentMeal.recipes.map(recipe => ({
          ...recipe,
          currentServings: servings,
          ingredients: recipe.originalIngredients?.map(ingredient => {
            const parsed = parseIngredient(ingredient);
            if (parsed) {
              parsed.amount *= ratio;
              return formatIngredient(parsed);
            }
            return ingredient;
          }) || recipe.ingredients
        }));

        return {
          currentMeal: {
            ...state.currentMeal,
            servings,
            recipes: updatedRecipes
          }
        };
      }),

      addToCurrentMeal: (recipe) => set((state) => ({
        currentMeal: {
          ...state.currentMeal,
          recipes: [...state.currentMeal.recipes, {
            ...recipe,
            originalIngredients: [...recipe.ingredients],
            currentServings: state.currentMeal.servings
          }]
        }
      })),

      removeFromCurrentMeal: (recipeId) => set((state) => ({
        currentMeal: {
          ...state.currentMeal,
          recipes: state.currentMeal.recipes.filter(r => r.id !== recipeId)
        }
      })),

      clearCurrentMeal: () => set((state) => ({
        currentMeal: {
          ...state.currentMeal,
          recipes: [],
          status: 'building'
        }
      })),

      startCooking: () => set((state) => ({
        currentMeal: {
          ...state.currentMeal,
          status: 'cooking'
        },
        isCooking: true
      })),

      generateShoppingList: () => set((state) => {
        const allIngredients = state.currentMeal.recipes.flatMap(r => r.ingredients);
        const consolidated = consolidateIngredients(allIngredients);
        
        return {
          currentMeal: {
            ...state.currentMeal,
            status: 'shopping'
          },
          shoppingList: [
            ...state.shoppingList,
            ...consolidated.map(item => ({
              id: `${Date.now()}-${Math.random()}`,
              name: item,
              recipeId: null,
              completed: false
            }))
          ]
        };
      }),

      addToShoppingList: (items, recipeId = null) => set((state) => ({
        shoppingList: [
          ...state.shoppingList,
          ...items.map(item => ({
            id: `${Date.now()}-${Math.random()}`,
            name: item,
            recipeId,
            completed: false
          }))
        ]
      })),

      removeFromShoppingList: (id) => set((state) => ({
        shoppingList: state.shoppingList.filter(item => item.id !== id)
      })),

      toggleShoppingItem: (id) => set((state) => ({
        shoppingList: state.shoppingList.map(item =>
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      })),

      clearCompletedItems: () => set((state) => ({
        shoppingList: state.shoppingList.filter(item => !item.completed)
      })),

      clearShoppingList: () => set({ shoppingList: [] }),

      setShowMenu: (show) => set({ showMenu: show }),
      setShowRecipePanel: (show) => set({ showRecipePanel: show }),

      filterRecipes: (query) => set((state) => {
        if (!query.trim()) return { filteredRecipes: state.recipes };
        const searchTerms = query.toLowerCase().split(' ');
        return {
          filteredRecipes: state.recipes.filter(recipe => {
            const searchText = createSearchIndex(recipe);
            return searchTerms.every(term => searchText.includes(term));
          })
        };
      }),

      markOnboardingComplete: () => set((state) => ({
        onboarding: {
          ...state.onboarding,
          hasCompletedOnboarding: true
        }
      })),

      completeOnboardingStep: (step) => set((state) => ({
        onboarding: {
          ...state.onboarding,
          steps: {
            ...state.onboarding.steps,
            [step]: true
          }
        }
      })),

      startTimer: (minutes) => set({
        isTimerActive: true,
        timerSeconds: minutes * 60
      }),

      stopTimer: () => set({
        isTimerActive: false,
        timerSeconds: 0
      }),

      decrementTimer: () => set((state) => ({
        timerSeconds: Math.max(0, state.timerSeconds - 1)
      }))
    }),
    {
      name: 'recipe-storage',
      partialize: (state) => ({
        recipes: state.recipes,
        shoppingList: state.shoppingList,
        currentMeal: state.currentMeal,
        onboarding: state.onboarding,
        chatMode: state.chatMode,
        lastSearch: state.lastSearch,
        suggestions: state.suggestions,
        searchMode: state.searchMode,
        chatHistory: state.chatHistory
      }),
    }
  )
);