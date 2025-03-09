import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { AllUsages, CreditInfo } from "@/types/settings";

const initialCreditInfo: CreditInfo = {
  remaining: 0,
  total: 0,
  used: 0,
};

const initialState: {
  credits: CreditInfo;
} = {
  credits: initialCreditInfo,
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setUsages: (state, action: PayloadAction<AllUsages>) => {
      return action.payload;
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
  },
});

export const { setUsages, incrementUsage, decrementUsage } =
  settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
