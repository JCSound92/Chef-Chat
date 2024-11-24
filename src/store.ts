import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Recipe, ShoppingListItem } from './types';
import { parseIngredient, formatIngredient, consolidateIngredients } from './utils/ingredientParser';

function scaleIngredients(ingredients: string[], ratio: number): string[] {
  return ingredients.map(ingredient => {
    const parsed = parseIngredient(ingredient);
    if (parsed) {
      parsed.amount *= ratio;
      return formatIngredient(parsed);
    }
    return ingredient;
  });
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      chatHistory: [],
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

      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setSuggestions: (recipes, searchQuery = '') => set((state) => ({ 
        suggestions: recipes,
        lastSearch: searchQuery || state.lastSearch
      })),
      
      setSearchMode: (mode) => set({ searchMode: mode }),

      setChatMode: (mode) => set({ chatMode: mode }),
      
      addChatMessage: (message: string, type: 'user' | 'chef') =>
        set((state) => ({
          chatHistory: [
            ...state.chatHistory,
            {
              id: `${Date.now()}-${Math.random()}`,
              message,
              type,
              timestamp: new Date()
            }
          ]
        })),

      clearChatHistory: () => set({ chatHistory: [] }),

      clearSearch: () => set({ suggestions: [], lastSearch: '' }),

      markOnboardingComplete: () => 
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            hasCompletedOnboarding: true
          }
        })),

      completeOnboardingStep: (step: keyof AppState['onboarding']['steps']) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            steps: {
              ...state.onboarding.steps,
              [step]: true
            }
          }
        })),

      filterRecipes: (query: string) => 
        set((state) => {
          if (!query.trim()) {
            return { filteredRecipes: state.recipes };
          }

          const searchTerms = query.toLowerCase().split(' ');
          const filtered = state.recipes.filter(recipe => {
            const searchText = `${recipe.title} ${recipe.description || ''} ${recipe.cuisine || ''}`.toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
          });

          return { 
            filteredRecipes: filtered,
            lastSearch: query
          };
        }),

      setCurrentRecipe: (recipe) => 
        set((state) => {
          if (recipe) {
            const recipeWithOriginals = {
              ...recipe,
              originalIngredients: [...recipe.ingredients],
              currentServings: 4
            };
            const exists = state.recipes.some((r) => r.id === recipe.id);
            return {
              currentRecipe: recipeWithOriginals,
              currentStep: 0,
              recipes: exists ? state.recipes : [recipe, ...state.recipes.slice(0, 29)],
            };
          }
          return { currentRecipe: null, currentStep: 0 };
        }),

      toggleFavorite: (recipeId) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId 
              ? { ...recipe, favorite: !recipe.favorite } 
              : recipe
          ),
          currentRecipe: state.currentRecipe?.id === recipeId
            ? { ...state.currentRecipe, favorite: !state.currentRecipe.favorite }
            : state.currentRecipe,
          suggestions: state.suggestions.map((recipe) =>
            recipe.id === recipeId
              ? { ...recipe, favorite: !recipe.favorite }
              : recipe
          ),
          filteredRecipes: state.filteredRecipes.filter(recipe => 
            recipe.id !== recipeId || !recipe.favorite
          )
        })),

      adjustPortions: (servings) =>
        set((state) => {
          if (!state.currentRecipe?.originalIngredients) return state;

          const ratio = servings / (state.currentRecipe.currentServings || 4);
          const updatedIngredients = scaleIngredients(
            state.currentRecipe.originalIngredients,
            ratio
          );

          const updatedRecipe = {
            ...state.currentRecipe,
            currentServings: servings,
            ingredients: updatedIngredients
          };

          return {
            currentRecipe: updatedRecipe,
            recipes: state.recipes.map(recipe =>
              recipe.id === updatedRecipe.id ? updatedRecipe : recipe
            )
          };
        }),

      adjustMealPortions: (servings) =>
        set((state) => {
          const ratio = servings / (state.currentMeal.servings || 4);
          
          const originalRecipes = state.currentMeal.originalRecipes?.length 
            ? state.currentMeal.originalRecipes
            : state.currentMeal.recipes.map(recipe => ({
                ...recipe,
                originalIngredients: recipe.originalIngredients || [...recipe.ingredients]
              }));

          const updatedRecipes = originalRecipes.map(recipe => ({
            ...recipe,
            currentServings: servings,
            ingredients: scaleIngredients(
              recipe.originalIngredients || [...recipe.ingredients],
              ratio
            )
          }));

          return {
            currentMeal: {
              ...state.currentMeal,
              servings: servings,
              recipes: updatedRecipes,
              originalRecipes
            }
          };
        }),

      addToCurrentMeal: (recipe) =>
        set((state) => ({
          currentMeal: {
            ...state.currentMeal,
            recipes: [...state.currentMeal.recipes, {
              ...recipe,
              originalIngredients: [...recipe.ingredients],
              currentServings: state.currentMeal.servings
            }],
            originalRecipes: [...(state.currentMeal.originalRecipes || []), {
              ...recipe,
              originalIngredients: [...recipe.ingredients]
            }]
          }
        })),

      removeFromCurrentMeal: (recipeId) =>
        set((state) => ({
          currentMeal: {
            ...state.currentMeal,
            recipes: state.currentMeal.recipes.filter(r => r.id !== recipeId),
            originalRecipes: (state.currentMeal.originalRecipes || []).filter(r => r.id !== recipeId)
          }
        })),

      clearCurrentMeal: () =>
        set({
          currentMeal: {
            recipes: [],
            status: 'building',
            servings: 4,
            originalRecipes: []
          }
        }),

      startCooking: () =>
        set((state) => ({
          currentMeal: {
            ...state.currentMeal,
            status: 'cooking'
          },
          isCooking: true
        })),

      generateShoppingList: () =>
        set((state) => {
          const allIngredients = state.currentMeal.recipes.flatMap(recipe => recipe.ingredients);
          const consolidatedIngredients = consolidateIngredients(allIngredients);
          
          return {
            currentMeal: {
              ...state.currentMeal,
              status: 'shopping'
            },
            shoppingList: [
              ...state.shoppingList,
              ...consolidatedIngredients.map((item) => ({
                id: `${Date.now()}-${Math.random()}`,
                name: item,
                recipeId: null,
                completed: false,
              })),
            ],
          };
        }),

      addToShoppingList: (items: string[], recipeId: string | null = null) =>
        set((state) => {
          const existingItems = state.shoppingList.map(item => item.name);
          const newItems = consolidateIngredients([...existingItems, ...items]);
          
          // Remove existing items
          const updatedList = state.shoppingList.filter(item => 
            !items.some(newItem => item.name.toLowerCase().includes(newItem.toLowerCase()))
          );
          
          return {
            shoppingList: [
              ...updatedList,
              ...newItems.map((item) => ({
                id: `${Date.now()}-${Math.random()}`,
                name: item,
                recipeId,
                completed: false,
              })),
            ],
          };
        }),

      removeFromShoppingList: (id: string) =>
        set((state) => ({
          shoppingList: state.shoppingList.filter((item) => item.id !== id),
        })),

      toggleShoppingItem: (id: string) =>
        set((state) => ({
          shoppingList: state.shoppingList.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
          ),
        })),

      clearCompletedItems: () =>
        set((state) => ({
          shoppingList: state.shoppingList.filter((item) => !item.completed),
        })),

      clearShoppingList: () =>
        set({ shoppingList: [] }),

      startTimer: (minutes: number) =>
        set({
          isTimerActive: true,
          timerSeconds: minutes * 60,
        }),

      stopTimer: () =>
        set({
          isTimerActive: false,
          timerSeconds: 0,
        }),

      decrementTimer: () =>
        set((state) => ({
          timerSeconds: Math.max(0, state.timerSeconds - 1),
        })),

      setShowMenu: (show) => set({ showMenu: show }),
      setShowRecipePanel: (show) => set({ showRecipePanel: show }),
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
        searchMode: state.searchMode
      }),
    }
  )
);