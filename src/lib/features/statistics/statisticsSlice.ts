import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { HourlyStats } from "@/types/notes-status";

export interface StatisticsState {
  bestTimeToPublish: HourlyStats[];
}

export const initialState: StatisticsState = {
  bestTimeToPublish: [],
};

const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    setBestTimeToPublish: (state, action: PayloadAction<HourlyStats[]>) => {
      state.bestTimeToPublish = action.payload;
    },
  },
});

export const { setBestTimeToPublish } = statisticsSlice.actions;

export const selectStatistics = (state: RootState): StatisticsState =>
  state.statistics;

export default statisticsSlice.reducer;
