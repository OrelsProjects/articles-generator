"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { EventTracker } from "@/eventTracker";
import { OnboardingContextType, OnboardingState } from "@/types/onboarding";
import axiosInstance from "@/lib/axios-instance";
import { Logger } from "@/logger";
import { usePathname } from "next/navigation";

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STEPS = [
  {
    id: 'inspiration',
    title: 'Browse Your Inspiration',
    description: 'Browse your past wins here to beat writer\'s block. Click any tile to open it in the editor.',
    targetPath: '/home'
  },
  {
    id: 'premium-filter', 
    title: 'Advanced Filters',
    description: 'Use advanced filters to surface your highest-impact ideas fast.',
    requiredPlan: 'premium',
    targetPath: '/home'
  },
  {
    id: 'schedule-note',
    title: 'Schedule Your Notes',
    description: 'Pick days you publish. We\'ll remind you and keep this graph green.',
    targetPath: '/queue'
  }
];

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAppSelector(state => state.auth);
  const pathname = usePathname();
  
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    isOpen: false,
    hasSeen: false,
    isLoading: false
  });

  // Check if user has seen onboarding
  useEffect(() => {
    if (user?.userId) {
      checkOnboardingStatus();
    }
  }, [user?.userId]);

  // Auto-start onboarding when user visits /home for the first time
  useEffect(() => {
    if (pathname === '/home' && user?.userId && !state.hasSeen && !state.isOpen) {
      start();
    }
  }, [pathname, user?.userId, state.hasSeen, state.isOpen]);

  const checkOnboardingStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await axiosInstance.get('/api/user/settings');
      const hasSeen = response.data.settings?.onboardingSeen || false;
      setState(prev => ({ ...prev, hasSeen, isLoading: false }));
    } catch (error) {
      Logger.error('Failed to check onboarding status', { error });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const persistOnboardingCompletion = async () => {
    try {
      await axiosInstance.post('/api/user/settings', {
        onboardingSeen: true
      });
    } catch (error) {
      Logger.error('Failed to persist onboarding completion', { error });
    }
  };

  const start = useCallback(() => {
    if (state.hasSeen) return;
    
    setState(prev => ({ ...prev, isOpen: true, currentStep: 0 }));
    EventTracker.track('onboarding_start', {
      userId: user?.userId,
      userPlan: user?.meta?.plan
    });
  }, [state.hasSeen, user?.userId, user?.meta?.plan]);

  const next = useCallback(() => {
    const currentStepData = ONBOARDING_STEPS[state.currentStep];
    
    // Track step completion
    EventTracker.track('onboarding_step_complete', {
      step: currentStepData?.id,
      stepIndex: state.currentStep,
      userId: user?.userId
    });

    // Check if we need to skip premium filter step
    if (state.currentStep === 0) { // After inspiration step
      const nextStep = ONBOARDING_STEPS[1];
      if (nextStep?.requiredPlan === 'premium' && user?.meta?.plan !== 'premium') {
        // Skip premium filter step
        setState(prev => ({ ...prev, currentStep: 2 }));
        return;
      }
    }

    // Move to next step or complete
    if (state.currentStep < ONBOARDING_STEPS.length - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    } else {
      complete();
    }
  }, [state.currentStep, user?.meta?.plan, user?.userId]);

  const skip = useCallback(() => {
    EventTracker.track('onboarding_dismiss', {
      step: ONBOARDING_STEPS[state.currentStep]?.id,
      stepIndex: state.currentStep,
      userId: user?.userId,
      reason: 'user_skip'
    });
    
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.currentStep, user?.userId]);

  const dismiss = useCallback(() => {
    EventTracker.track('onboarding_dismiss', {
      step: ONBOARDING_STEPS[state.currentStep]?.id,
      stepIndex: state.currentStep,
      userId: user?.userId,
      reason: 'user_dismiss'
    });
    
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.currentStep, user?.userId]);

  const complete = useCallback(async () => {
    setState(prev => ({ ...prev, isOpen: false, hasSeen: true }));
    
    EventTracker.track('onboarding_done', {
      userId: user?.userId,
      completedSteps: ONBOARDING_STEPS.length
    });

    await persistOnboardingCompletion();
  }, [user?.userId]);

  const reset = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentStep: 0, 
      isOpen: false, 
      hasSeen: false 
    }));
  }, []);

  const contextValue: OnboardingContextType = {
    currentStep: state.currentStep,
    isOpen: state.isOpen,
    hasSeen: state.hasSeen,
    isLoading: state.isLoading,
    next,
    skip,
    reset,
    start,
    dismiss,
    complete
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}; 