import { useState, useEffect } from 'react';

export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!('visualViewport' in window)) {
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const handler = () => {
      const offsetHeight = window.innerHeight - viewport.height;
      if (offsetHeight > 150) { // Threshold to avoid false positives
        document.documentElement.style.setProperty(
          '--keyboard-height',
          `${offsetHeight}px`
        );
        setIsKeyboardVisible(true);
      } else {
        document.documentElement.style.setProperty(
          '--keyboard-height',
          '0px'
        );
        setIsKeyboardVisible(false);
      }
    };

    viewport.addEventListener('resize', handler);
    viewport.addEventListener('scroll', handler);

    // Initial check
    handler();

    return () => {
      viewport.removeEventListener('resize', handler);
      viewport.removeEventListener('scroll', handler);
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    };
  }, []);

  return { isKeyboardVisible };
}