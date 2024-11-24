import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { useStore } from '../store';

export function ChatHistory() {
  const { chatHistory } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!chatHistory.length) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <AnimatePresence initial={false}>
          {chatHistory.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] flex items-start gap-3 ${
                  message.type === 'user'
                    ? 'flex-row-reverse'
                    : 'flex-row'
                }`}
              >
                {message.type === 'chef' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-[#e05f3e] rounded-lg flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-xl p-4 ${
                    message.type === 'user'
                      ? 'bg-[#e05f3e] text-white'
                      : 'bg-white shadow-lg'
                  }`}
                >
                  <p className="leading-relaxed">{message.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}