import { useState } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { selectSettings, addCredits, resetCredits } from '@/lib/features/settings/settingsSlice';
import { toast } from 'react-toastify';

export function useCredits() {
  const [isResetting, setIsResetting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const settings = useAppSelector(selectSettings);
  const dispatch = useAppDispatch();
  
  const { credits } = settings;

  // Reset credits to the plan's allocation
  const resetUserCredits = async () => {
    if (isResetting) return;
    
    try {
      setIsResetting(true);
      const response = await fetch('/api/usage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset credits');
      }
      
      // Update the Redux store with the new credit amount
      dispatch(resetCredits(data.credits));
      toast.success('Credits have been reset successfully!');
    } catch (error) {
      console.error('Error resetting credits:', error);
      toast.error('Failed to reset credits. Please try again later.');
    } finally {
      setIsResetting(false);
    }
  };

  // Add credits to the user's account
  const addUserCredits = async (amount: number) => {
    if (isAdding) return;
    
    try {
      setIsAdding(true);
      // This would typically call an API endpoint to add credits
      // For now, we'll just update the Redux store
      dispatch(addCredits(amount));
      toast.success(`${amount} credits have been added to your account!`);
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error('Failed to add credits. Please try again later.');
    } finally {
      setIsAdding(false);
    }
  };

  // Check if user has enough credits for an operation
  const hasEnoughCredits = (cost: number) => {
    return credits.remaining >= cost;
  };

  return {
    credits,
    resetUserCredits,
    addUserCredits,
    hasEnoughCredits,
    isResetting,
    isAdding,
  };
} 