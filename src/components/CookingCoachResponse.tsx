import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';

interface CookingCoachResponseProps {
  response: string;
}

export function CookingCoachResponse({ response }: CookingCoachResponseProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-24 left-0 right-0 px-4"
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-[#FF6B6B] rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-gray-700 leading-relaxed">{response}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}