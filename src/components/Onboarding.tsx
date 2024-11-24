import React from 'react';
import { useStore } from '../store';

export function Onboarding() {
  const { onboarding, markOnboardingComplete } = useStore();

  React.useEffect(() => {
    if (!onboarding.hasCompletedOnboarding) {
      markOnboardingComplete();
    }
  }, [onboarding.hasCompletedOnboarding, markOnboardingComplete]);

  return null;
}