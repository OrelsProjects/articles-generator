import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InspirationFilters, Note } from "@/types/note";

interface InspirationState {
  inspirationNotes: Note[];
  loadingInspiration: boolean;
  error: string | null;
  filters: InspirationFilters;
  hasMore: boolean;
  nextCursor: string | null;
  hasMoreInspirationNotes: boolean;
}

const initialState: InspirationState = {
  inspirationNotes: [],
  loadingInspiration: false,
  filters: {
    type: "relevant-to-user",
  },
  error: null,
  hasMore: true,
  nextCursor: null,
  hasMoreInspirationNotes: true,
};

const inspirationSlice = createSlice({
  name: "inspiration",
  initialState,
  reducers: {
    setInspirationNotes: (state, action: PayloadAction<Note[]>) => {
      state.inspirationNotes = action.payload;
    },
    addInspirationNotes: (
      state,
      action: PayloadAction<{
        items: Note[];
        nextCursor: string | null;
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
      }
      state.nextCursor = action.payload.nextCursor;
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
  },
});

export const {
  setInspirationNotes,
  addInspirationNotes,
  setLoadingInspiration,
  setError,
  setInspirationFilters,
} = inspirationSlice.actions;

export default inspirationSlice.reducer;
