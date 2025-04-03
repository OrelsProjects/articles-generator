import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InspirationFilters, InspirationNote, InspirationSort, Note } from "@/types/note";

interface InspirationState {
  inspirationNotes: InspirationNote[];
  loadingInspiration: boolean;
  error: string | null;
  filters: InspirationFilters;
  sort: InspirationSort;
  hasMore: boolean;
  currentPage: number;
  hasMoreInspirationNotes: boolean;
}

const initialState: InspirationState = {
  inspirationNotes: [],
  loadingInspiration: false,
  filters: {
    type: "relevant-to-user",
  },
  sort: {
    type: "relevance",
    direction: "desc",
  },
  error: null,
  hasMore: true,
  currentPage: 1,
  hasMoreInspirationNotes: true,
};

const inspirationSlice = createSlice({
  name: "inspiration",
  initialState,
  reducers: {
    setInspirationNotes: (state, action: PayloadAction<InspirationNote[]>) => {
      state.inspirationNotes = action.payload;
      state.currentPage = 1;
    },
    addInspirationNotes: (
      state,
      action: PayloadAction<{
        items: InspirationNote[];
        hasMore: boolean;
        options?: { toStart: boolean };
      }>,
    ) => {
      if (action.payload.options?.toStart) {
        state.inspirationNotes = [
          ...action.payload.items,
          ...state.inspirationNotes,
        ];
        state.hasMoreInspirationNotes = action.payload.hasMore;
      } else {
        state.inspirationNotes.push(...action.payload.items);
        state.currentPage += 1;
      }
      state.hasMore = action.payload.hasMore;
    },
    setLoadingInspiration: (state, action: PayloadAction<boolean>) => {
      state.loadingInspiration = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setInspirationFilters: (
      state,
      action: PayloadAction<InspirationFilters>,
    ) => {
      state.filters = action.payload;
    },
    setInspirationSort: (state, action: PayloadAction<InspirationSort>) => {
      state.sort = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
});

export const {
  setInspirationNotes,
  addInspirationNotes,
  setLoadingInspiration,
  setError,
  setInspirationFilters,
  setInspirationSort,
  setCurrentPage,
} = inspirationSlice.actions;

export default inspirationSlice.reducer;
