import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { HourlyStats, Streak, NoteStats, ReactionInterval, NoteWithEngagementStats } from "@/types/notes-stats";
import { Engager } from "@/types/engager";

export interface StatisticsState {
  bestTimeToPublish: HourlyStats[];
  streak: Streak[];
  topEngagers: Engager[];
  noteStats: NoteStats | null;
  notesForDate: NoteWithEngagementStats[];
  loadingFetchBestTimeToPublish: boolean;
  loadingReactions: boolean;
  loadingNotesForDate: boolean;
  reactionsInterval: ReactionInterval;

  fetchingStreak: boolean;
  fetchingTopEngagers: boolean;
  fetchingReactions: boolean;
  fetchingBestTimeToPublish: boolean;
}

export const initialState: StatisticsState = {
  bestTimeToPublish: [],
  streak: [],
  topEngagers: [],
  noteStats: null,
  notesForDate: [],
  loadingFetchBestTimeToPublish: false,
  loadingReactions: false,
  loadingNotesForDate: false,
  reactionsInterval: "day",
  fetchingStreak: false,
  fetchingTopEngagers: false,
  fetchingReactions: false,
  fetchingBestTimeToPublish: false,
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
    setFetchingStreak: (state, action: PayloadAction<boolean>) => {
      state.fetchingStreak = action.payload;
    },
    setFetchingTopEngagers: (state, action: PayloadAction<boolean>) => {
      state.fetchingTopEngagers = action.payload;
    },
    setFetchingReactions: (state, action: PayloadAction<boolean>) => {
      state.fetchingReactions = action.payload;
    },
    setFetchingBestTimeToPublish: (state, action: PayloadAction<boolean>) => {
      state.fetchingBestTimeToPublish = action.payload;
    },
    setNotesForDate: (state, action: PayloadAction<NoteWithEngagementStats[]>) => {
      state.notesForDate = action.payload;
    },
    setLoadingNotesForDate: (state, action: PayloadAction<boolean>) => {
      state.loadingNotesForDate = action.payload;
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
  setFetchingStreak,
  setFetchingTopEngagers,
  setFetchingReactions,
  setFetchingBestTimeToPublish,
  setNotesForDate,
  setLoadingNotesForDate,
} = statisticsSlice.actions;

export const selectStatistics = (state: RootState): StatisticsState =>
  state.statistics;

export default statisticsSlice.reducer;
