import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ScrollPickerProps {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  label: string;
}

function ScrollPicker({ values, value, onChange, label }: ScrollPickerProps) {
  const itemHeight = 40;
  const visibleItems = 5;
  const halfVisibleItems = Math.floor(visibleItems / 2);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const newValue = values[Math.min(Math.max(0, index), values.length - 1)];
    if (newValue !== value) {
      onChange(newValue);
      // Snap to the closest value
      requestAnimationFrame(() => {
        e.currentTarget.scrollTop = index * itemHeight;
      });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const currentIndex = values.indexOf(value);
    const newIndex = Math.min(Math.max(0, currentIndex + delta), values.length - 1);
    onChange(values[newIndex]);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="relative w-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-[80px]" />
          <div className="h-[40px] border-t border-b border-[#FF6B6B]/20" />
        </div>
        <div 
          className="h-[200px] overflow-y-scroll no-scrollbar relative scroll-smooth"
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          <div className="h-[80px]" />
          {values.map((num) => (
            <div
              key={num}
              className={`h-[40px] flex items-center justify-center text-2xl font-medium select-none transition-all ${
                num === value ? 'text-[#FF6B6B] scale-110' : 'text-gray-400'
              }`}
            >
              {String(num).padStart(2, '0')}
            </div>
          ))}
          <div className="h-[80px]" />
        </div>
      </div>
    </div>
  );
}

interface TimerPickerProps {
  onClose: () => void;
  onStart: (totalSeconds: number) => void;
}

export function TimerPicker({ onClose, onStart }: TimerPickerProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const hourValues = Array.from({ length: 6 }, (_, i) => i);
  const minuteValues = Array.from({ length: 60 }, (_, i) => i);
  const secondValues = Array.from({ length: 60 }, (_, i) => i);

  const handleStart = () => {
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    if (totalSeconds > 0) {
      onStart(totalSeconds);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Set Timer</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center gap-8 mb-8">
          <ScrollPicker
            values={hourValues}
            value={hours}
            onChange={setHours}
            label="hours"
          />
          <ScrollPicker
            values={minuteValues}
            value={minutes}
            onChange={setMinutes}
            label="minutes"
          />
          <ScrollPicker
            values={secondValues}
            value={seconds}
            onChange={setSeconds}
            label="seconds"
          />
        </div>

        <button
          onClick={handleStart}
          disabled={hours === 0 && minutes === 0 && seconds === 0}
          className="w-full py-3 bg-[#FF6B6B] text-white rounded-xl font-medium hover:bg-[#FF5252] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Timer
        </button>
      </motion.div>
    </motion.div>
  );
}