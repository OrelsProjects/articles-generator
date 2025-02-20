import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";

export interface UiState {
  state: "full" | "writing-mode";
  showIdeasPanel: boolean;
}

export const initialState: UiState = {
  state: "writing-mode",
  showIdeasPanel: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setUiState: (state, action) => {
      state.state = action.payload;
    },
    setShowIdeasPanel: (state, action) => {
      state.showIdeasPanel = action.payload;
    },
  },
});

export const { setUiState, setShowIdeasPanel } = uiSlice.actions;

export const selectUi = (state: RootState): UiState => state.ui;

export default uiSlice.reducer;
