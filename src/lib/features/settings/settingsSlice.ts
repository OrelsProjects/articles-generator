import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { AllUsages, CreditInfo, Settings } from "@/types/settings";

const initialCreditInfo: CreditInfo = {
  remaining: 0,
  total: 0,
  used: 0,
};

const initialState: {
  credits: CreditInfo;
  cancelAt: Date | undefined;
  settings: Settings;
} = {
  credits: initialCreditInfo,
  cancelAt: undefined,
  settings: {
    generatingDescription: false,
    onboardingSetupCompleted: false,
  },
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setUsages: (state, action: PayloadAction<AllUsages>) => {
      return {
        ...state,
        credits: action.payload.credits,
      };
    },
    incrementUsage: (state, action: PayloadAction<{ amount: number }>) => {
      const { amount } = action.payload;
      state.credits.remaining += amount;
      state.credits.used -= amount;
    },
    decrementUsage: (state, action: PayloadAction<{ amount: number }>) => {
      const { amount } = action.payload;
      state.credits.remaining -= amount;
      state.credits.used += amount;
    },
    setCancelAt: (state, action: PayloadAction<Date | undefined>) => {
      state.cancelAt = action.payload;
    },
    setGeneratingDescription: (state, action: PayloadAction<boolean>) => {
      state.settings.generatingDescription = action.payload;
    },
    setOnboardingSetupCompleted: (state, action: PayloadAction<boolean>) => {
      state.settings.onboardingSetupCompleted = action.payload;
    },
  },
});

export const {
  setUsages,
  incrementUsage,
  decrementUsage,
  setCancelAt,
  setGeneratingDescription,
  setOnboardingSetupCompleted,
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
