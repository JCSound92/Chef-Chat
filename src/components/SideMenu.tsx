import React from 'react';
import { X, Heart, History, Settings, Info } from 'lucide-react';
import { useStore } from '../store';

export function SideMenu() {
  const { showMenu, setShowMenu, setShowRecipePanel } = useStore();

  const handleRecipeClick = () => {
    setShowMenu(false);
    setShowRecipePanel(true);
  };

  if (!showMenu) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={() => setShowMenu(false)}
      />
      <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 animate-fade-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={() => setShowMenu(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={handleRecipeClick}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl text-left"
            >
              <History className="w-5 h-5" />
              <span>Recent Recipes</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl text-left">
              <Heart className="w-5 h-5" />
              <span>Favorites</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl text-left">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl text-left">
              <Info className="w-5 h-5" />
              <span>About</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}