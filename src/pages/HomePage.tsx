import React from 'react';
import { MessageCircle, ChefHat, Utensils, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { motion } from 'framer-motion';

const MODES = [
  {
    id: 'plan',
    title: 'Plan a Meal',
    icon: Utensils,
    description: 'Create a multi-course meal plan',
    color: '#e05f3e',
    path: '/search',
    searchMode: 'plan' as const
  },
  {
    id: 'find',
    title: 'Find a Recipe',
    icon: Search,
    description: 'Search for a specific recipe',
    color: '#95cad4',
    path: '/search',
    searchMode: 'recipe' as const
  },
  {
    id: 'fridge',
    title: "What's in Your Fridge?",
    icon: ChefHat,
    description: 'Find recipes with ingredients you have',
    color: '#982517',
    path: '/search',
    searchMode: 'ingredients' as const
  },
  {
    id: 'chat',
    title: 'Talk to Chef',
    icon: MessageCircle,
    description: 'Get answers to your cooking questions',
    color: '#e05f3e',
    path: '/chat'
  }
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const { setChatMode, setSearchMode, clearSearch, addChatMessage } = useStore();

  const handleModeSelect = (mode: typeof MODES[number]) => {
    clearSearch();
    
    if (mode.id === 'chat') {
      setChatMode(true);
      const welcomeMessages = [
        "What ya need?",
        "What's on your mind?",
        "What now chef?",
        "How can I help ya?",
        "What's cookin'?",
        "Need some advice?",
        "Kitchen troubles?",
        "Oh sure, what's up?"
      ];
      const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      addChatMessage(randomMessage, 'chef', 'chef');
      navigate(mode.path);
    } else if (mode.searchMode) {
      setChatMode(false);
      setSearchMode(mode.searchMode);
      navigate(mode.path);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MODES.map((mode) => (
            <motion.button
              key={mode.id}
              onClick={() => handleModeSelect(mode)}
              className="bg-white rounded-xl p-4 text-left shadow-lg hover:shadow-xl transition-all group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: mode.color }}
                >
                  {React.createElement(mode.icon, {
                    className: "w-5 h-5 text-white"
                  })}
                </div>
                <h2 className="text-lg font-bold group-hover:text-[#e05f3e] transition-colors">
                  {mode.title}
                </h2>
              </div>
              <p className="text-sm text-gray-600">{mode.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}