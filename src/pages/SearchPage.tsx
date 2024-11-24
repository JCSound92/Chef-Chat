import React from 'react';
import { RecipeSuggestions } from '../components/RecipeSuggestions';
import { Loader2, ChefHat } from 'lucide-react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

const SEARCH_PLACEHOLDERS = {
  plan: "What kind of meal would you like to plan?",
  recipe: "What recipe are you looking for?",
  ingredients: "What ingredients do you have?"
};

const WELCOME_MESSAGES = {
  plan: "What are we cooking tonight?",
  recipe: "What sounds good chef?",
  ingredients: "What ya got chef?"
};

export function SearchPage() {
  const { suggestions, isLoading, searchMode, lastSearch } = useStore();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#e05f3e] mx-auto mb-4" />
          <p className="text-gray-600">Finding the perfect recipes...</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0 && !lastSearch) {
    return (
      <div className="fixed inset-0 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="w-16 h-16 bg-[#e05f3e] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {WELCOME_MESSAGES[searchMode]}
          </h2>
          <p className="text-gray-600">
            Type in the search bar below to get started
          </p>
        </motion.div>
      </div>
    );
  }

  return <RecipeSuggestions placeholderText={SEARCH_PLACEHOLDERS[searchMode]} />;
}