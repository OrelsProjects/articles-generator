import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { AIUsageType } from "@prisma/client";
import { AllUsages, CreditInfo } from "@/types/settings";

const initialCreditInfo: CreditInfo = {
  remaining: 0,
  total: 0,
  used: 0,
};

const initialState: AllUsages = {
  ideaGeneration: { count: 0, max: 0, didExceed: false, creditCost: 0 },
  textEnhancement: { count: 0, max: 0, didExceed: false, creditCost: 0 },
  titleOrSubtitleRefinement: { count: 0, max: 0, didExceed: false, creditCost: 0 },
  credits: initialCreditInfo,
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setUsages: (state, action: PayloadAction<AllUsages>) => {
      return action.payload;
    },
    incrementUsage: (state, action: PayloadAction<AIUsageType>) => {
      const usageType = action.payload;
      state[usageType].count += 1;
      
      // Also update credits
      if (state.credits.remaining >= (state[usageType].creditCost || 0)) {
        state.credits.remaining -= state[usageType].creditCost || 0;
        state.credits.used += state[usageType].creditCost || 0;
      }
      
      // Update didExceed based on remaining credits
      state[usageType].didExceed = state.credits.remaining < (state[usageType].creditCost || 0);
    },
    decrementUsage: (state, action: PayloadAction<AIUsageType>) => {
      const usageType = action.payload;
      if (state[usageType].count > 0) {
        state[usageType].count -= 1;
      }
    },
    // Add credits to user's account
    addCredits: (state, action: PayloadAction<number>) => {
      state.credits.remaining += action.payload;
      state.credits.total += action.payload;
      
      // Update didExceed flags based on new credit balance
      state.ideaGeneration.didExceed = 
        state.credits.remaining < (state.ideaGeneration.creditCost || 0);
      state.textEnhancement.didExceed = 
        state.credits.remaining < (state.textEnhancement.creditCost || 0);
      state.titleOrSubtitleRefinement.didExceed = 
        state.credits.remaining < (state.titleOrSubtitleRefinement.creditCost || 0);
    },
    // Reset credits to the plan's allocation
    resetCredits: (state, action: PayloadAction<number>) => {
      state.credits.remaining = action.payload;
      state.credits.total = action.payload;
      state.credits.used = 0;
      
      // Update didExceed flags based on new credit balance
      state.ideaGeneration.didExceed = 
        state.credits.remaining < (state.ideaGeneration.creditCost || 0);
      state.textEnhancement.didExceed = 
        state.credits.remaining < (state.textEnhancement.creditCost || 0);
      state.titleOrSubtitleRefinement.didExceed = 
        state.credits.remaining < (state.titleOrSubtitleRefinement.creditCost || 0);
    },
  },
});

export const { 
  setUsages, 
  incrementUsage, 
  decrementUsage,
  addCredits,
  resetCredits
} = settingsSlice.actions;

export const selectSettings = (state: RootState): AllUsages =>
  state.settings;

export default settingsSlice.reducer;
