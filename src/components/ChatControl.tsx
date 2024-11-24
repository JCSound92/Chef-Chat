import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Loader2, Send } from 'lucide-react';
import { useStore } from '../store';
import { suggestRecipes, getCookingAdvice } from '../api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatControl() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  
  const { 
    setIsLoading, 
    setSuggestions,
    currentRecipe,
    currentMeal,
    isCooking,
    setCurrentRecipe,
    addToShoppingList,
    adjustPortions,
    adjustMealPortions,
    isLoading,
    recipes,
    filterRecipes,
    chatMode,
    addChatMessage,
    clearSearch
  } = useStore();

  const isSearchView = location.pathname === '/recent' || location.pathname === '/saved';

  const getPlaceholder = () => {
    if (isLoading) {
      return chatMode ? "Asking Oh Sure Chef..." : "Finding recipes...";
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

    if (isCooking) {
      return "Ask about timing, temperature, and techniques...";
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

  useEffect(() => {
    if (isSearchView) {
      filterRecipes(input);
    }
  }, [input, isSearchView, filterRecipes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isSearchView) {
      return;
    }

    const query = input.trim().toLowerCase();
    setInput('');

    if (chatMode || isCooking) {
      addChatMessage(query, 'user');
    }

    if (chatMode || isCooking) {
      try {
        setIsTyping(true);
        const response = await getCookingAdvice(query, currentRecipe || { title: '' });
        addChatMessage(response, 'chef');
      } catch (error) {
        toast.error('Failed to get cooking advice. Please try again.');
      } finally {
        setIsTyping(false);
      }
      return;
    }

    if (handleServingAdjustment(query)) {
      return;
    }

    try {
      setIsLoading(true);
      setIsTyping(true);
      const recipes = await suggestRecipes(query);
      setSuggestions(recipes, query);
      setCurrentRecipe(null);
    } catch (error) {
      toast.error('Failed to find recipes. Please try again.');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
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
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              className="flex-1 pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e05f3e] focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-3 p-2 text-gray-400 hover:text-[#e05f3e] transition-colors"
              disabled={!input.trim()}
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