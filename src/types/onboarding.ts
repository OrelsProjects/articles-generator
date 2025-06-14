export interface OnboardingState {
  currentStep: number;
  isOpen: boolean;
  hasSeen: boolean;
  isLoading: boolean;
}

export interface OnboardingContextType {
  // State
  currentStep: number;
  isOpen: boolean;
  hasSeen: boolean;
  isLoading: boolean;
  
  // Actions
  next: () => void;
  skip: () => void;
  reset: () => void;
  start: () => void;
  dismiss: () => void;
  complete: () => void;
}

export type OnboardingStep = 
  | 'inspiration'
  | 'premium-filter'
  | 'schedule-note';

export interface OnboardingStepConfig {
  id: OnboardingStep;
  title: string;
  description: string;
  targetSelector?: string;
  requiredPlan?: string;
  skipCondition?: (user: any) => boolean;
} 