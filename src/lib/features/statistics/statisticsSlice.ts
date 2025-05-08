import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { HourlyStats, Streak } from "@/types/notes-stats";

export interface StatisticsState {
  bestTimeToPublish: HourlyStats[];
  streak: Streak[];
  loadingFetchBestTimeToPublish: boolean;
}

export const initialState: StatisticsState = {
  bestTimeToPublish: [],
  streak: [],
  loadingFetchBestTimeToPublish: false,
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
    setLoadingFetchBestTimeToPublish: (state, action: PayloadAction<boolean>) => {
      state.loadingFetchBestTimeToPublish = action.payload;
    },
  },
});

export const {
  setBestTimeToPublish,
  setStreak,
  setLoadingFetchBestTimeToPublish,
} = statisticsSlice.actions;

export const selectStatistics = (state: RootState): StatisticsState =>
  state.statistics;

export default statisticsSlice.reducer;
