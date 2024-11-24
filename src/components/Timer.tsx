import React, { useEffect } from 'react';
import { Timer as TimerIcon, X } from 'lucide-react';
import { useStore } from '../store';

const TIMER_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function Timer() {
  const { isTimerActive, timerSeconds, stopTimer, decrementTimer } = useStore();

  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      if (timerSeconds <= 0) {
        stopTimer();
        // Play notification sound
        const audio = new Audio(TIMER_SOUND_URL);
        audio.play().catch(console.error);

        // Show system notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Timer Finished!', {
            body: 'Your cooking timer has finished.',
            icon: '/vite.svg'
          });
        }
      } else {
        decrementTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds, stopTimer, decrementTimer]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!isTimerActive) return null;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  return (
    <div className="fixed bottom-24 right-8 bg-white rounded-2xl shadow-xl p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <TimerIcon className="w-5 h-5 text-[#FF6B6B] animate-pulse" />
        <span className="text-xl font-semibold">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
        <button
          onClick={stopTimer}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}