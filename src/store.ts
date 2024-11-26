import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Recipe, ShoppingListItem, MealPlan, ChatMessage } from './types';
import { consolidateIngredients, parseIngredient, formatIngredient } from './utils/ingredientParser';

const MAX_CHAT_HISTORY = 100;
const MAX_RECENT_RECIPES = 20;

const migrate = (persistedState: any, version: number): AppState => {
  if (version === 0) {
    const chatHistory = persistedState.chatHistory || [];
    return {
      ...persistedState,
      chatContexts: {
        chef: chatHistory.map((msg: any) => ({
          ...msg,
          context: 'chef'
        })),
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
      // State
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
          // Add recipes to recent list when they're suggested
          const existingIds = new Set(state.recipes.map(r => r.id));
          const newRecipes = recipes.filter(r => !existingIds.has(r.id));
          
          return {
            suggestions: append ? [...state.suggestions, ...recipes] : recipes,
            lastSearch: searchQuery || state.lastSearch,
            lastRecipeRequest: searchQuery || state.lastRecipeRequest,
            // Add new recipes to the recent list
            recipes: [...newRecipes, ...state.recipes].slice(0, MAX_RECENT_RECIPES)
          };
        });
      },
      
      setSearchMode: (mode) => set({ searchMode: mode }),
      setChatMode: (mode) => set({ chatMode: mode }),
      
      addChatMessage: (message, type, context) => set((state) => {
        const newMessage = {
          id: `${Date.now()}-${Math.random()}`,
          message,
          type,
          timestamp: new Date(),
          context
        };

        if (context === 'cooking') {
          return {
            chatContexts: {
              ...state.chatContexts,
              cooking: newMessage
            }
          };
        }

        return {
          chatContexts: {
            ...state.chatContexts,
            chef: [...state.chatContexts.chef.slice(-MAX_CHAT_HISTORY), newMessage]
          }
        };
      }),

      clearChatHistory: (context) => set((state) => ({
        chatContexts: {
          ...state.chatContexts,
          [context]: context === 'chef' ? [] : null
        }
      })),

      clearSearch: () => set({ 
        suggestions: [], 
        lastSearch: '',
        lastRecipeRequest: ''
      }),

      setCurrentRecipe: (recipe) => {
        if (recipe) {
          set((state) => {
            // Add to recent recipes if not already present
            const existingIndex = state.recipes.findIndex(r => r.id === recipe.id);
            const updatedRecipes = [...state.recipes];
            
            if (existingIndex !== -1) {
              // Move to top if already exists
              updatedRecipes.splice(existingIndex, 1);
            }
            updatedRecipes.unshift(recipe);
            
            return {
              currentRecipe: recipe,
              recipes: updatedRecipes.slice(0, MAX_RECENT_RECIPES)
            };
          });
        } else {
          set({ currentRecipe: null });
        }
      },

      toggleFavorite: (recipeId) => set((state) => ({
        recipes: state.recipes.map(r => 
          r.id === recipeId ? { ...r, favorite: !r.favorite } : r
        ),
        suggestions: state.suggestions.map(r =>
          r.id === recipeId ? { ...r, favorite: !r.favorite } : r
        ),
        currentRecipe: state.currentRecipe?.id === recipeId
          ? { ...state.currentRecipe, favorite: !state.currentRecipe.favorite }
          : state.currentRecipe
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

      addToCurrentMeal: (recipe) => {
        set((state) => {
          // Add to recent recipes when adding to meal
          const existingIndex = state.recipes.findIndex(r => r.id === recipe.id);
          const updatedRecipes = [...state.recipes];
          
          if (existingIndex !== -1) {
            updatedRecipes.splice(existingIndex, 1);
          }
          updatedRecipes.unshift(recipe);
          
          return {
            currentMeal: {
              ...state.currentMeal,
              recipes: [...state.currentMeal.recipes, {
                ...recipe,
                originalIngredients: [...recipe.ingredients],
                currentServings: state.currentMeal.servings
              }]
            },
            recipes: updatedRecipes.slice(0, MAX_RECENT_RECIPES)
          };
        });
      },

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

      startCooking: () => set({
        cookingState: {
          isActive: true,
          currentStepIndex: 0,
          currentRecipeIndex: 0
        }
      }),

      stopCooking: () => set({
        cookingState: {
          isActive: false,
          currentStepIndex: 0,
          currentRecipeIndex: 0
        }
      }),

      setCurrentStep: (stepIndex) => set((state) => ({
        cookingState: {
          ...state.cookingState,
          currentStepIndex: stepIndex
        }
      })),

      setCurrentRecipeIndex: (recipeIndex) => set((state) => ({
        cookingState: {
          ...state.cookingState,
          currentRecipeIndex: recipeIndex
        }
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
            const searchText = `${recipe.title} ${recipe.description || ''} ${recipe.cuisine || ''} ${
              recipe.type || ''} ${recipe.ingredients.join(' ')}`.toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
          })
        };
      }),

      startTimer: (seconds) => set({
        isTimerActive: true,
        timerSeconds: seconds
      }),

      stopTimer: () => set({
        isTimerActive: false,
        timerSeconds: 0
      }),

      decrementTimer: () => set((state) => ({
        timerSeconds: Math.max(0, state.timerSeconds - 1)
      })),

      setVoiceState: (newState) => set((state) => ({
        voiceState: { ...state.voiceState, ...newState }
      })),

      createMealPlan: (name) => set((state) => ({
        mealPlans: [
          ...state.mealPlans,
          {
            id: `${Date.now()}-${Math.random()}`,
            name,
            recipes: [],
            createdAt: new Date()
          }
        ]
      })),

      deleteMealPlan: (id) => set((state) => ({
        mealPlans: state.mealPlans.filter(plan => plan.id !== id)
      })),

      setCurrentMealPlan: (plan) => set((state) => ({
        currentMeal: plan ? {
          recipes: plan.recipes,
          status: 'building',
          servings: 4,
          originalRecipes: plan.recipes
        } : state.currentMeal
      })),

      removeRecipeFromMealPlan: (planId, recipeId) => set((state) => ({
        mealPlans: state.mealPlans.map(plan =>
          plan.id === planId
            ? { ...plan, recipes: plan.recipes.filter(r => r.id !== recipeId) }
            : plan
        )
      })),

      addMealPlanToShoppingList: (planId) => set((state) => {
        const plan = state.mealPlans.find(p => p.id === planId);
        if (!plan) return state;

        const allIngredients = plan.recipes.flatMap(r => r.ingredients);
        const consolidated = consolidateIngredients(allIngredients);

        return {
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
      })
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
        mealPlans: state.mealPlans,
        cookingState: state.cookingState
      })
    }
  )
);