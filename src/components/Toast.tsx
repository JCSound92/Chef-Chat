import React from 'react';
import toast from 'react-hot-toast';
import { ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomToast {
  message: string | React.ReactNode;
  type?: 'success' | 'error';
}

export function Toast() {
  return (
    <div className="fixed bottom-24 left-0 right-0 z-50">
      {toast.custom<CustomToast>((t) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-3xl mx-auto px-4"
        >
          <div className="bg-white rounded-xl shadow-lg p-4 flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              t.type === 'error' ? 'bg-red-500' : 'bg-[#e05f3e]'
            }`}>
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed">
                {typeof t.message === 'string' ? t.message : 'Notification'}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}