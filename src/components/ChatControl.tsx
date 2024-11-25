import React, { useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Loader2, Send } from 'lucide-react';
import { useStore } from '../store';
import { suggestRecipes, getCookingAdvice } from '../api';
import toast from 'react-hot-toast';
import { debounce } from '../utils/debounce';
import { CookingCoachResponse } from './CookingCoachResponse';

export function ChatControl() {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  
  const { 
    setIsLoading, 
    setSuggestions,
    currentRecipe,
    currentMeal,
    isCooking,
    setCurrentRecipe,
    adjustPortions,
    adjustMealPortions,
    isLoading,
    filterRecipes,
    chatMode,
    addChatMessage,
    lastRecipeRequest,
    searchMode,
    clearChatHistory,
    chatContexts
  } = useStore();

  const isSearchView = location.pathname === '/recent' || location.pathname === '/saved';
  const isSearchMode = location.pathname === '/search';
  const isChefMode = chatMode && location.pathname === '/chat';
  const isCookingMode = location.pathname === '/cooking';
  const isMealPlanMode = location.pathname === '/current-meal';

  // Clear cooking chat when leaving cooking mode
  React.useEffect(() => {
    if (!isCookingMode && chatContexts.cooking) {
      clearChatHistory('cooking');
    }
  }, [isCookingMode, clearChatHistory, chatContexts.cooking]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      filterRecipes(value);
    }, 150),
    [filterRecipes]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (isSearchView) {
      debouncedSearch(value);
    }
  };

  const handleServingAdjustment = (command: string): boolean => {
    const servingMatch = command.match(/(?:adjust|make|scale|serve|for)?.*?(\d+)\s*(?:people|servings|guests)?/i);
    if (servingMatch) {
      const newServings = parseInt(servingMatch[1], 10);
      if (newServings > 0 && newServings <= 100) {
        if (isMealPlanMode && currentMeal.recipes.length > 0) {
          adjustMealPortions(newServings);
          toast.success(`Adjusted meal for ${newServings} people`);
          return true;
        } else if (currentRecipe) {
          adjustPortions(newServings);
          toast.success(`Adjusted recipe for ${newServings} people`);
          return true;
        }
      } else {
        toast.error('Please enter a serving size between 1 and 100');
        return true;
      }
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input.trim().toLowerCase();
    setInput('');

    if (isSearchView) {
      return;
    }

    // Handle different chat contexts
    if (isChefMode) {
      addChatMessage(query, 'user', 'chef');
      try {
        setIsLoading(true);
        const response = await getCookingAdvice(query, null);
        if (response) {
          addChatMessage(response, 'chef', 'chef');
        }
      } catch (error) {
        console.error('API Error:', error);
        toast.error('Sorry, I had trouble understanding that. Could you try asking in a different way?');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isMealPlanMode) {
      if (!handleServingAdjustment(query)) {
        toast.error('Please enter the number of people to serve (e.g., "6 people" or just "6")');
      }
      return;
    }

    if (isCookingMode) {
      try {
        setIsLoading(true);
        const response = await getCookingAdvice(
          query,
          currentRecipe || currentMeal.recipes[0]
        );
        if (response) {
          addChatMessage(query, 'user', 'cooking');
          addChatMessage(response, 'chef', 'cooking');
        }
      } catch (error) {
        console.error('API Error:', error);
        toast.error('Sorry, I had trouble with that. Could you try asking differently?');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isSearchMode || searchMode) {
      try {
        setIsLoading(true);
        clearChatHistory('cooking');
        
        const contextQuery = searchMode === 'ingredients' 
          ? `Find recipes using these ingredients: ${query}`
          : searchMode === 'plan'
          ? `Suggest recipes for a meal including: ${query}`
          : query;

        const recipes = await suggestRecipes(contextQuery, currentMeal.recipes);
        if (recipes && recipes.length > 0) {
          setSuggestions(recipes, query);
          setCurrentRecipe(null);
        } else {
          throw new Error('No recipes found');
        }
      } catch (error) {
        console.error('API Error:', error);
        toast.error('No recipes found. Try different ingredients or keywords.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getPlaceholder = () => {
    if (isLoading) {
      if (isChefMode || isCookingMode) {
        return "Asking Oh Sure Chef...";
      }
      return "Finding recipes...";
    }

    if (isChefMode) {
      return "Ask any cooking question...";
    }

    if (location.pathname === '/recent') {
      return "Search your recent recipes...";
    }
    if (location.pathname === '/saved') {
      return "Search your saved recipes...";
    }

    if (isCookingMode) {
      return "Ask about timing, temperature, techniques, or substitutions...";
    }

    if (currentRecipe) {
      return "Try 'adjust for 4 people' or ask about ingredients...";
    }

    if (isMealPlanMode) {
      return "How many people are we serving?";
    }

    if (searchMode === 'plan') {
      return "What kind of meal would you like to plan?";
    }
    if (searchMode === 'ingredients') {
      return "What ingredients do you have?";
    }
    if (searchMode === 'recipe') {
      return "What recipe are you looking for?";
    }

    return "What can I help you with?";
  };

  // Don't show chat on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <>
      {isCookingMode && chatContexts.cooking && <CookingCoachResponse />}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg chat-input-container">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
          <div className="relative flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-[#e05f3e] animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-[#e05f3e]" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={getPlaceholder()}
              className="flex-1 pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e05f3e] focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="absolute right-3 p-2 text-gray-400 hover:text-[#e05f3e] transition-colors"
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
      <div className="h-20" />
    </>
  );
}