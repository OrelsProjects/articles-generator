import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { AIUsageType } from "@prisma/client";
import { AllUsages } from "@/types/settings";

export interface SettingsState {
  usage: AllUsages;
}

export const initialState: SettingsState = {
  usage: {
    [AIUsageType.ideaGeneration]: { count: 0, max: 0, didExceed: false },
    [AIUsageType.textEnhancement]: { count: 0, max: 0, didExceed: false },
    [AIUsageType.titleOrSubtitleRefinement]: {
      count: 0,
      max: 0,
      didExceed: false,
    },
  },
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    incrementUsage: (state, action: PayloadAction<AIUsageType>) => {
      state.usage[action.payload].count++;
      if (state.usage[action.payload].count > state.usage[action.payload].max) {
        state.usage[action.payload].didExceed = true;
      }
    },
    decrementUsage: (state, action: PayloadAction<AIUsageType>) => {
      if (state.usage[action.payload].count > 0) {
        state.usage[action.payload].count--;
        if (
          state.usage[action.payload].count < state.usage[action.payload].max
        ) {
          state.usage[action.payload].didExceed = false;
        }
      }
    },
    setUsages: (state, action: PayloadAction<AllUsages>) => {
      state.usage = action.payload;
    },
  },
});

export const { incrementUsage, decrementUsage, setUsages } =
  settingsSlice.actions;

export const selectSettings = (state: RootState): SettingsState =>
  state.settings;

export default settingsSlice.reducer;
