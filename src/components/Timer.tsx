import React, { useEffect, useRef } from 'react';
import { Timer as TimerIcon, X } from 'lucide-react';
import { useStore } from '../store';

// Use a reliable, short sound that works well on mobile
const TIMER_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2472/2472-preview.mp3';

export function Timer() {
  const { isTimerActive, timerSeconds, stopTimer, decrementTimer } = useStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize audio on component mount
  useEffect(() => {
    audioRef.current = new Audio(TIMER_SOUND_URL);
    audioRef.current.loop = true;
    
    // Preload the audio
    const preloadAudio = () => {
      if (audioRef.current) {
        audioRef.current.load();
        document.removeEventListener('click', preloadAudio);
      }
    };
    
    // Preload on first user interaction to handle mobile
    document.addEventListener('click', preloadAudio);
    
    return () => {
      document.removeEventListener('click', preloadAudio);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isTimerActive) return;

    intervalRef.current = window.setInterval(() => {
      if (timerSeconds <= 0) {
        stopTimer();
        if (audioRef.current) {
          // Play sound with error handling
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Audio playback failed:', error);
              // Try playing again with user interaction
              const playOnClick = () => {
                if (audioRef.current) {
                  audioRef.current.play().catch(console.error);
                  document.removeEventListener('click', playOnClick);
                }
              };
              document.addEventListener('click', playOnClick, { once: true });
            });
          }
        }
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
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isTimerActive, timerSeconds, stopTimer, decrementTimer]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopTimer();
  };

  if (!isTimerActive && !audioRef.current?.currentTime) return null;

  const formatTime = () => {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const seconds = timerSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    if (minutes > 0) {
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(seconds).padStart(2, '0')} sec`;
  };

  return (
    <div className="fixed bottom-24 right-8 bg-white rounded-2xl shadow-xl p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <TimerIcon className={`w-5 h-5 text-[#FF6B6B] ${timerSeconds === 0 ? 'animate-pulse' : ''}`} />
        <span className="text-xl font-semibold">{formatTime()}</span>
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