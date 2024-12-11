import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding.ts';

export function OnboardingModal() {
  const { hasSeenOnboarding, completeOnboarding } = useOnboarding();

  if (hasSeenOnboarding) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="m-4 md:m-20 bg-white rounded-2xl"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Welcome to Chef Chat!</h2>
              <button
                onClick={completeOnboarding}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-black">
              <iframe 
                src="https://share.descript.com/embed/Nk545nQglDa" 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                allowFullScreen
                title="Chef Chat Tutorial"
              />
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={completeOnboarding}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}