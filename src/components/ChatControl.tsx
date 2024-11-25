import React, { useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Loader2, Send } from 'lucide-react';
import { useStore } from '../store';
import { suggestRecipes, getCookingAdvice } from '../api';
import toast from 'react-hot-toast';
import { CookingCoachResponse } from './CookingCoachResponse';
import debounce from 'lodash/debounce';

export function ChatControl(): JSX.Element {
  const [input, setInput] = useState('');
  const [cookingResponse, setCookingResponse] = useState<string | null>(null);
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
    addChatMessage
  } = useStore();

  const isSearchView = location.pathname === '/recent' || location.pathname === '/saved';
  const isCookingMode = isCooking || location.pathname === '/cooking';

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

  const getPlaceholder = () => {
    if (isLoading) {
      if (chatMode || isCookingMode) {
        return "Asking Oh Sure Chef...";
      }
      return "Finding recipes...";
    }

    if (chatMode) {
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

    if (location.pathname === '/current-meal') {
      if (currentMeal.recipes.length > 0) {
        return "Try 'adjust meal for 6 people' or ask about prep...";
      }
      return "What would you like to cook tonight?";
    }

    switch (location.pathname) {
      case '/':
        return "What do you want to cook tonight?";
      case '/shopping-list':
        return "Ask about ingredients or substitutions...";
      default:
        return "How can I help with your cooking?";
    }
  };

  const handleServingAdjustment = (command: string) => {
    const servingMatch = command.match(/(?:adjust|make|scale).*?(\d+)\s*(?:people|servings)/i);
    if (servingMatch) {
      const newServings = parseInt(servingMatch[1], 10);
      if (newServings > 0 && newServings <= 100) {
        if ((command.includes('meal') || location.pathname === '/current-meal') && currentMeal.recipes.length > 0) {
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

    if (chatMode || isCookingMode) {
      addChatMessage(query, 'user');
    }

    if (handleServingAdjustment(query)) {
      return;
    }

    try {
      setIsLoading(true);

      if (chatMode || isCookingMode) {
        const response = await getCookingAdvice(query, currentRecipe);
        if (response) {
          if (isCookingMode) {
            setCookingResponse(response);
          } else {
            addChatMessage(response, 'chef');
          }
        } else {
          throw new Error('No response received');
        }
      } else {
        const recipes = await suggestRecipes(query, currentMeal.recipes);
        if (recipes && recipes.length > 0) {
          setSuggestions(recipes, query);
          setCurrentRecipe(null);
        } else {
          throw new Error('No recipes found');
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(errorMessage);
      if (chatMode || isCookingMode) {
        addChatMessage("Ope! Sorry about that. Could you try asking in a different way?", 'chef');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {cookingResponse && (
        <CookingCoachResponse 
          response={cookingResponse} 
          onDismiss={() => setCookingResponse(null)} 
        />
      )}
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