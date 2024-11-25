import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ScrollPickerProps {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  label: string;
  itemHeight: number;
}

function ScrollPicker({ values, value, onChange, label, itemHeight }: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isDragging) return;
      
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        const scrollTop = container.scrollTop;
        const index = Math.round(scrollTop / itemHeight);
        const newValue = values[Math.min(Math.max(0, index), values.length - 1)];
        
        if (newValue !== value) {
          onChange(newValue);
          requestAnimationFrame(() => {
            container.scrollTo({
              top: index * itemHeight,
              behavior: 'smooth'
            });
          });
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [value, values, onChange, itemHeight, isDragging]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isScrolling) return;

    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const currentIndex = values.indexOf(value);
    const newIndex = Math.min(Math.max(0, currentIndex + delta), values.length - 1);
    onChange(values[newIndex]);

    containerRef.current?.scrollTo({
      top: newIndex * itemHeight,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const index = values.indexOf(value);
    containerRef.current?.scrollTo({
      top: index * itemHeight,
      behavior: 'auto'
    });
  }, [value, values, itemHeight]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="relative w-16">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ height: itemHeight * 2 }} />
          <div 
            style={{ height: itemHeight }}
            className="border-t border-b border-[#FF6B6B]/20 bg-[#FF6B6B]/5"
          />
        </div>

        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onWheel={handleWheel}
          className="h-[200px] overflow-y-scroll no-scrollbar relative scroll-smooth"
        >
          <div style={{ height: itemHeight * 2 }} />
          {values.map((num) => (
            <div
              key={num}
              style={{ height: itemHeight }}
              className={`flex items-center justify-center text-2xl font-medium select-none transition-all ${
                num === value 
                  ? 'text-[#FF6B6B] scale-110' 
                  : 'text-gray-400'
              }`}
            >
              {String(num).padStart(2, '0')}
            </div>
          ))}
          <div style={{ height: itemHeight * 2 }} />
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

  const hourValues = Array.from({ length: 24 }, (_, i) => i);
  const minuteValues = Array.from({ length: 60 }, (_, i) => i);
  const secondValues = Array.from({ length: 60 }, (_, i) => i);

  const handleStart = () => {
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    if (totalSeconds > 0) {
      onStart(totalSeconds);
      onClose();
    }
  };

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    if (minutes > 0) {
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    return seconds > 0 ? `${seconds} sec` : '0 sec';
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

        <div className="flex justify-center gap-8 mb-4">
          <ScrollPicker
            values={hourValues}
            value={hours}
            onChange={setHours}
            label="hours"
            itemHeight={40}
          />
          <ScrollPicker
            values={minuteValues}
            value={minutes}
            onChange={setMinutes}
            label="minutes"
            itemHeight={40}
          />
          <ScrollPicker
            values={secondValues}
            value={seconds}
            onChange={setSeconds}
            label="seconds"
            itemHeight={40}
          />
        </div>

        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-[#FF6B6B]">
            {formatTime()}
          </span>
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