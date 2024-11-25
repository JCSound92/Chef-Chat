import React from 'react';
import { ChefHat, Search, ShoppingCart, BookmarkCheck, History, Utensils, Home } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';

export function Navigation() {
  const { 
    shoppingList, 
    currentMeal, 
    setCurrentRecipe,
    suggestions,
    setChatMode,
    clearChatHistory,
    lastSearch
  } = useStore();
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentRecipe(null);
    setChatMode(false);
    
    if (suggestions.length > 0 && location.pathname !== '/search') {
      navigate('/search');
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentRecipe(null);
    setChatMode(false);
    clearChatHistory();
    navigate('/');
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentRecipe(null);
    setChatMode(true);
    navigate('/chat');
  };

  const pendingItems = shoppingList.filter(item => !item.completed).length;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg shadow-sm z-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={handleHomeClick}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Home"
          >
            <Home className="w-6 h-6 text-[#333333]" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleChatClick}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Chat with Chef"
            >
              <ChefHat className="w-6 h-6 text-[#e05f3e]" />
            </button>
            <button
              onClick={handleSearchClick}
              className={`p-2 hover:bg-gray-100 rounded-lg ${suggestions.length > 0 ? 'text-[#e05f3e]' : ''}`}
              title={lastSearch ? `Show results for "${lastSearch}"` : "Find Recipes"}
            >
              <Search className="w-6 h-6" />
            </button>
            <Link
              to="/current-meal"
              className="p-2 hover:bg-gray-100 rounded-lg relative"
              title="Tonight's Meal"
            >
              <Utensils className="w-6 h-6 text-[#333333]" />
              {currentMeal.recipes.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e05f3e] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {currentMeal.recipes.length}
                </span>
              )}
            </Link>
            <Link
              to="/recent"
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Recent Recipes"
            >
              <History className="w-6 h-6 text-[#333333]" />
            </Link>
            <Link
              to="/saved"
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Saved Recipes"
            >
              <BookmarkCheck className="w-6 h-6 text-[#333333]" />
            </Link>
            <Link
              to="/shopping-list"
              className="p-2 hover:bg-gray-100 rounded-lg relative"
              title="Shopping List"
            >
              <ShoppingCart className="w-6 h-6 text-[#333333]" />
              {pendingItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e05f3e] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}