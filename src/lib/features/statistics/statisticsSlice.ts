import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { HourlyStats, Streak, NoteStats, ReactionInterval } from "@/types/notes-stats";
import { Engager } from "@/types/engager";

export interface StatisticsState {
  bestTimeToPublish: HourlyStats[];
  streak: Streak[];
  topEngagers: Engager[];
  noteStats: NoteStats | null;
  loadingFetchBestTimeToPublish: boolean;
  loadingReactions: boolean;
  reactionsInterval: ReactionInterval;
}

export const initialState: StatisticsState = {
  bestTimeToPublish: [],
  streak: [],
  topEngagers: [],
  noteStats: null,
  loadingFetchBestTimeToPublish: false,
  loadingReactions: false,
  reactionsInterval: "day",
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
    setLoadingFetchBestTimeToPublish: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.loadingFetchBestTimeToPublish = action.payload;
    },
    setTopEngagers: (state, action: PayloadAction<Engager[]>) => {
      state.topEngagers = action.payload;
    },
    setNoteStats: (state, action: PayloadAction<NoteStats>) => {
      state.noteStats = action.payload;
    },
    setLoadingReactions: (state, action: PayloadAction<boolean>) => {
      state.loadingReactions = action.payload;
    },
    setReactionsInterval: (state, action: PayloadAction<ReactionInterval>) => {
      state.reactionsInterval = action.payload;
    },
  },
});

export const {
  setBestTimeToPublish,
  setStreak,
  setLoadingFetchBestTimeToPublish,
  setTopEngagers,
  setNoteStats,
  setLoadingReactions,
  setReactionsInterval,
} = statisticsSlice.actions;

export const selectStatistics = (state: RootState): StatisticsState =>
  state.statistics;

export default statisticsSlice.reducer;
