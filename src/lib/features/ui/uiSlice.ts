import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";

export interface UiState {
  state: "full" | "writing-mode";
}

export const initialState: UiState = {
  state: "full",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setUiState: (state, action) => {
      state.state = action.payload;
    },
  },
});

export const { setUiState } = uiSlice.actions;

export const selectUi = (state: RootState): UiState => state.ui;

export default uiSlice.reducer;
