import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";

export interface UiState {
  state: "full" | "writing-mode";
  showIdeasPanel: boolean;
  showGenerateNotesSidebar: boolean;
  showAnalyzePublicationDialog: boolean;
  showGenerateIdeasDialog: boolean;
  sideBarState: "collapsed" | "expanded";
}

export const initialState: UiState = {
  state: "writing-mode",
  showIdeasPanel: false,
  showGenerateNotesSidebar: false,
  showAnalyzePublicationDialog: false,
  showGenerateIdeasDialog: false,
  sideBarState: "expanded",
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
    setShowAnalyzePublicationDialog: (state, action) => {
      state.showAnalyzePublicationDialog = action.payload;
    },
    setShowGenerateIdeasDialog: (state, action) => {
      state.showGenerateIdeasDialog = action.payload;
    },
    setShowGenerateNotesSidebar: (state, action) => {
      state.showGenerateNotesSidebar = action.payload;
    },
    setSideBarState: (state, action) => {
      state.sideBarState = action.payload;
    },
  },
});

export const {
  setUiState,
  setShowIdeasPanel,
  setShowAnalyzePublicationDialog,
  setShowGenerateIdeasDialog,
  setShowGenerateNotesSidebar,
  setSideBarState,
} = uiSlice.actions;

export const selectUi = (state: RootState): UiState => state.ui;

export default uiSlice.reducer;
