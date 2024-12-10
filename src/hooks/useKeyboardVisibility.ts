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
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${offsetHeight}px`
      );
      setIsKeyboardVisible(offsetHeight > 0);
    };

    viewport.addEventListener('resize', handler);
    viewport.addEventListener('scroll', handler);

    return () => {
      viewport.removeEventListener('resize', handler);
      viewport.removeEventListener('scroll', handler);
    };
  }, []);

  return { isKeyboardVisible };
}