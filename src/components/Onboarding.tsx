import React from 'react';
import { useStore } from '../store';

export function Onboarding() {
  const { onboarding, markOnboardingComplete } = useStore();

  // Just mark onboarding as complete without showing toasts
  React.useEffect(() => {
    if (!onboarding.hasCompletedOnboarding) {
      markOnboardingComplete();
    }
  }, [onboarding, markOnboardingComplete]);

  return null;
}