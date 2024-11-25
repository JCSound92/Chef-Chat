import React, { useEffect, useRef } from 'react';
import { Timer as TimerIcon, X } from 'lucide-react';
import { useStore } from '../store';

const TIMER_SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-morning-rooster-crowing-2462.mp3';

export function Timer() {
  const { isTimerActive, timerSeconds, stopTimer, decrementTimer } = useStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isTimerActive) return;

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio(TIMER_SOUND_URL);
      audioRef.current.loop = true;
    }

    intervalRef.current = window.setInterval(() => {
      if (timerSeconds <= 0) {
        // Stop the timer countdown
        stopTimer();

        // Play sound
        if (audioRef.current) {
          audioRef.current.play().catch(console.error);
        }

        // Show notification if supported
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

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerActive, timerSeconds, stopTimer, decrementTimer]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopTimer();
  };

  if (!isTimerActive && !audioRef.current?.currentTime) return null;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  return (
    <div className="fixed bottom-24 right-8 bg-white rounded-2xl shadow-xl p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <TimerIcon className="w-5 h-5 text-[#FF6B6B] animate-pulse" />
        <span className="text-xl font-semibold">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <button
          onClick={handleStop}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}