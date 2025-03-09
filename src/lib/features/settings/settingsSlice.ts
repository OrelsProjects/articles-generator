import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { AIUsageType } from "@prisma/client";
import { AllUsages, CreditInfo, Usage } from "@/types/settings";

const initialCreditInfo: CreditInfo = {
  remaining: 0,
  total: 0,
  used: 0,
  articleCredits: {
    remaining: 0,
    total: 0,
    used: 0,
  },
  regularCredits: {
    remaining: 0,
    total: 0,
    used: 0,
  }
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
    incrementUsage: (state, action: PayloadAction<{ type: AIUsageType, creditType: 'article' | 'regular' }>) => {
      const { type: usageType, creditType } = action.payload;
      state[usageType].count += 1;
      
      // Update the appropriate credit type
      const creditField = creditType === 'article' ? 'articleCredits' : 'regularCredits';
      
      // Also update credits
      if (state.credits[creditField].remaining >= (state[usageType].creditCost || 0)) {
        state.credits[creditField].remaining -= state[usageType].creditCost || 0;
        state.credits[creditField].used += state[usageType].creditCost || 0;
        
        // Update legacy field for backward compatibility
        state.credits.remaining = state.credits.articleCredits.remaining + state.credits.regularCredits.remaining;
        state.credits.used = state.credits.articleCredits.used + state.credits.regularCredits.used;
      }
      
      // Update didExceed based on remaining credits
      state[usageType].didExceed = state.credits[creditField].remaining < (state[usageType].creditCost || 0);
    },
    decrementUsage: (state, action: PayloadAction<AIUsageType>) => {
      const usageType = action.payload;
      if (state[usageType].count > 0) {
        state[usageType].count -= 1;
      }
    },
    // Add credits to user's account
    addCredits: (state, action: PayloadAction<{ articleCredits?: number, regularCredits?: number }>) => {
      const { articleCredits = 0, regularCredits = 0 } = action.payload;
      
      state.credits.articleCredits.remaining += articleCredits;
      state.credits.articleCredits.total += articleCredits;
      
      state.credits.regularCredits.remaining += regularCredits;
      state.credits.regularCredits.total += regularCredits;
      
      // Update legacy field for backward compatibility
      state.credits.remaining = state.credits.articleCredits.remaining + state.credits.regularCredits.remaining;
      state.credits.total = state.credits.articleCredits.total + state.credits.regularCredits.total;
      
      // Update didExceed flags based on new credit balance
      updateDidExceedFlags(state);
    },
  },
});

// Helper function to update didExceed flags
const updateDidExceedFlags = (state: AllUsages) => {
  // Update didExceed for idea generation (uses article credits)
  state.ideaGeneration.didExceed = 
    state.credits.articleCredits.remaining < (state.ideaGeneration.creditCost || 0);
  
  // Update didExceed for text enhancement (uses regular credits)
  state.textEnhancement.didExceed = 
    state.credits.regularCredits.remaining < (state.textEnhancement.creditCost || 0);
  
  // Update didExceed for title refinement (uses regular credits)
  state.titleOrSubtitleRefinement.didExceed = 
    state.credits.regularCredits.remaining < (state.titleOrSubtitleRefinement.creditCost || 0);
};

export const { 
  setUsages, 
  incrementUsage, 
  decrementUsage,
  addCredits,
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
