import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Recipe, ShoppingListItem, ChatMessage } from './types';
import { consolidateIngredients } from './utils/ingredientParser';

const MAX_CHAT_HISTORY = 100;
const MAX_RECENT_RECIPES = 20;
const MAX_SEARCH_HISTORY = 10;

const migrate = (persistedState: any, version: number): AppState => {
  if (version === 0) {
    return {
      ...persistedState,
      searchHistory: [],
      chatContexts: {
        chef: persistedState.chatHistory || [],
        cooking: null
      },
      cookingState: {
        isActive: false,
        currentStepIndex: 0,
        currentRecipeIndex: 0
      }
    };
  }
  return persistedState as AppState;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      recipes: [],
      filteredRecipes: [],
      suggestions: [],
      lastSearch: '',
      searchMode: 'recipe',
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
      chatContexts: {
        chef: [],
        cooking: null
      },
      lastRecipeRequest: '',
      searchHistory: [],
      currentMeal: {
        recipes: [],
        status: 'building',
        servings: 4,
        originalRecipes: []
      },
      cookingState: {
        isActive: false,
        currentStepIndex: 0,
        currentRecipeIndex: 0
      },
      voiceState: {
        isListening: false,
        error: null,
        transcript: ''
      },
      mealPlans: [],

      // Actions
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setSuggestions: (recipes, searchQuery = '', append = false) => {
        set((state) => {
          const existingIds = new Set(state.recipes.map(r => r.id));
          const newRecipes = recipes.filter(r => !existingIds.has(r.id));
          
          const searchHistory = searchQuery 
            ? [
                { 
                  query: searchQuery, 
                  mode: state.searchMode, 
                  timestamp: Date.now() 
                },
                ...state.searchHistory.filter(h => h.query !== searchQuery)
              ].slice(0, MAX_SEARCH_HISTORY)
            : state.searchHistory;

          return {
            suggestions: append ? [...state.suggestions, ...recipes] : recipes,
            lastSearch: searchQuery || state.lastSearch,
            lastRecipeRequest: searchQuery || state.lastRecipeRequest,
            searchHistory,
            recipes: [...newRecipes, ...state.recipes].slice(0, MAX_RECENT_RECIPES)
          };
        });
      },

      setSearchMode: (mode) => set({ searchMode: mode }),
      setChatMode: (mode) => set({ chatMode: mode }),
      clearSearch: () => set({ suggestions: [], lastSearch: '', lastRecipeRequest: '' }),
      restoreSearch: (query, mode) => set({ searchMode: mode, lastSearch: query, lastRecipeRequest: query }),
      setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
      
      toggleFavorite: (id) => set((state) => ({
        recipes: state.recipes.map(recipe =>
          recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe
        ),
        filteredRecipes: state.filteredRecipes.map(recipe =>
          recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe
        ),
        suggestions: state.suggestions.map(recipe =>
          recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe
        )
      })),

      addToCurrentMeal: (recipe) => set((state) => ({
        currentMeal: {
          ...state.currentMeal,
          recipes: [...state.currentMeal.recipes, recipe]
        }
      })),

      removeFromCurrentMeal: (id) => set((state) => ({
        currentMeal: {
          ...state.currentMeal,
          recipes: state.currentMeal.recipes.filter(recipe => recipe.id !== id)
        }
      })),

      clearCurrentMeal: () => set({
        currentMeal: {
          recipes: [],
          status: 'building',
          servings: 4,
          originalRecipes: []
        }
      }),

      adjustPortions: (servings) => {
        set((state) => {
          if (!state.currentRecipe) return state;

          const recipe = state.currentRecipe;
          const originalServings = recipe.currentServings || 4;
          const ratio = servings / originalServings;

          const adjustedRecipe: Recipe = {
            ...recipe,
            currentServings: servings,
            ingredients: recipe.ingredients.map(ingredient => {
              const match = ingredient.match(/^(\d*\.?\d+)\s+(.+)$/);
              if (!match) return ingredient;
              const [, amount, rest] = match;
              const newAmount = (parseFloat(amount) * ratio).toFixed(1);
              return `${newAmount} ${rest}`;
            })
          };

          return { currentRecipe: adjustedRecipe };
        });
      },

      adjustMealPortions: (servings) => {
        set((state) => {
          const ratio = servings / state.currentMeal.servings;
          const adjustedRecipes = state.currentMeal.recipes.map(recipe => ({
            ...recipe,
            currentServings: servings,
            ingredients: recipe.ingredients.map(ingredient => {
              const match = ingredient.match(/^(\d*\.?\d+)\s+(.+)$/);
              if (!match) return ingredient;
              const [, amount, rest] = match;
              const newAmount = (parseFloat(amount) * ratio).toFixed(1);
              return `${newAmount} ${rest}`;
            })
          }));

          return {
            currentMeal: {
              ...state.currentMeal,
              servings,
              recipes: adjustedRecipes
            }
          };
        });
      },

      addToShoppingList: (ingredients, recipeId) => set((state) => ({
        shoppingList: [
          ...state.shoppingList,
          ...ingredients.map(ingredient => ({
            id: `${Date.now()}-${Math.random()}`,
            name: ingredient,
            completed: false,
            recipeId
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

      clearShoppingList: () => set({ shoppingList: [] }),

      clearCompletedItems: () => set((state) => ({
        shoppingList: state.shoppingList.filter(item => !item.completed)
      })),

      startTimer: (seconds) => set({ isTimerActive: true, timerSeconds: seconds }),
      stopTimer: () => set({ isTimerActive: false, timerSeconds: 0 }),
      decrementTimer: () => set((state) => ({ timerSeconds: Math.max(0, state.timerSeconds - 1) })),

      startCooking: () => set((state) => ({
        cookingState: {
          isActive: true,
          currentStepIndex: 0,
          currentRecipeIndex: 0
        },
        currentMeal: {
          ...state.currentMeal,
          status: 'cooking'
        }
      })),

      stopCooking: () => set((state) => ({
        cookingState: {
          isActive: false,
          currentStepIndex: 0,
          currentRecipeIndex: 0
        },
        currentMeal: {
          ...state.currentMeal,
          status: 'completed'
        }
      })),

      setCurrentStep: (step) => set((state) => ({
        cookingState: {
          ...state.cookingState,
          currentStepIndex: step
        }
      })),

      setCurrentRecipeIndex: (index) => set((state) => ({
        cookingState: {
          ...state.cookingState,
          currentRecipeIndex: index
        }
      })),

      filterRecipes: (query) => set((state) => ({
        filteredRecipes: state.recipes.filter(recipe =>
          recipe.title.toLowerCase().includes(query.toLowerCase()) ||
          recipe.description?.toLowerCase().includes(query.toLowerCase())
        )
      })),

      addChatMessage: (message, type, context) => {
        const newMessage: ChatMessage = {
          id: `${Date.now()}-${Math.random()}`,
          message,
          type,
          context,
          timestamp: Date.now()
        };

        set((state) => {
          if (context === 'cooking') {
            return {
              chatContexts: {
                ...state.chatContexts,
                cooking: newMessage
              }
            };
          }

          const updatedHistory = [
            ...state.chatContexts.chef,
            newMessage
          ].slice(-MAX_CHAT_HISTORY);

          return {
            chatContexts: {
              ...state.chatContexts,
              chef: updatedHistory
            }
          };
        });
      },

      clearChatHistory: (context) => set((state) => ({
        chatContexts: {
          ...state.chatContexts,
          [context]: context === 'cooking' ? null : []
        }
      })),

      generateShoppingList: () => {
        set((state) => {
          const allIngredients = state.currentMeal.recipes.flatMap(recipe => recipe.ingredients);
          const consolidatedIngredients = consolidateIngredients(allIngredients);

          const newItems: ShoppingListItem[] = consolidatedIngredients.map(ingredient => ({
            id: `${Date.now()}-${Math.random()}`,
            name: ingredient,
            completed: false,
            recipeId: undefined
          }));

          return {
            currentMeal: {
              ...state.currentMeal,
              status: 'completed'
            },
            shoppingList: [...state.shoppingList, ...newItems]
          };
        });
      }
    }),
    {
      name: 'recipe-storage',
      version: 1,
      migrate,
      partialize: (state) => ({
        recipes: state.recipes,
        shoppingList: state.shoppingList,
        currentMeal: state.currentMeal,
        chatMode: state.chatMode,
        lastSearch: state.lastSearch,
        suggestions: state.suggestions,
        searchMode: state.searchMode,
        chatContexts: state.chatContexts,
        searchHistory: state.searchHistory,
        mealPlans: state.mealPlans,
        cookingState: state.cookingState
      })
    }
  )
);