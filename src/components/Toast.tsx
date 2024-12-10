import React from 'react';
import toast, { Toast as ToastType } from 'react-hot-toast';
import { ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

export function Toast() {
  React.useEffect(() => {
    toast.custom((t: ToastType) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-lg p-4 flex items-start gap-3"
      >
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
      </motion.div>
    ), {
      position: 'bottom-center',
      duration: 2000,
      style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
        maxWidth: '48rem',
        margin: '0 auto 6rem'
      }
    });
  }, []);

  return null;
}