import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { HourlyStats, Streak } from "@/types/notes-stats";

export interface StatisticsState {
  bestTimeToPublish: HourlyStats[];
  streak: Streak[];
}

export const initialState: StatisticsState = {
  bestTimeToPublish: [],
  streak: [],
};

const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    setBestTimeToPublish: (state, action: PayloadAction<HourlyStats[]>) => {
      state.bestTimeToPublish = action.payload;
    },
    setStreak: (state, action: PayloadAction<Streak[]>) => {
      state.streak = action.payload;
    },
  },
});

export const { setBestTimeToPublish, setStreak } = statisticsSlice.actions;

export const selectStatistics = (state: RootState): StatisticsState =>
  state.statistics;

export default statisticsSlice.reducer;
