import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { CreatePostResponse } from "@/types/createPostResponse";

export interface UiState {
  state: "full" | "writing-mode";
  showIdeasPanel: boolean;
  showGenerateNotesSidebar: boolean;
  showAnalyzePublicationDialog: boolean;
  showGenerateIdeasDialog: boolean;
  sideBarState: "collapsed" | "expanded";
  didShowSaveTooltip: boolean;
  showScheduleModal: boolean;
  showExtensionDialog: boolean;
  showExtensionDisabledDialog: boolean;
  showNoSubstackCookiesDialog: boolean;
  showCreateScheduleDialog: boolean;
  notePostedData: CreatePostResponse | null;
  hideFeedbackFab: boolean;
}

export const initialState: UiState = {
  state: "writing-mode",
  showIdeasPanel: false,
  showGenerateNotesSidebar: false,
  showAnalyzePublicationDialog: false,
  showGenerateIdeasDialog: false,
  sideBarState: "expanded",
  didShowSaveTooltip: false,
  showScheduleModal: false,
  showExtensionDialog: false,
  showExtensionDisabledDialog: false,
  showNoSubstackCookiesDialog: false,
  showCreateScheduleDialog: false,
  notePostedData: null,
  hideFeedbackFab: false,
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
    setDidShowSaveTooltip: (state, action) => {
      state.didShowSaveTooltip = action.payload;
    },
    setShowScheduleModal: (state, action) => {
      state.showScheduleModal = action.payload;
    },
    setShowExtensionDialog: (state, action) => {
      state.showExtensionDialog = action.payload;
    },
    setShowExtensionDisabledDialog: (state, action) => {
      state.showExtensionDisabledDialog = action.payload;
    },
    setShowNoSubstackCookiesDialog: (state, action) => {
      state.showNoSubstackCookiesDialog = action.payload;
    },
    setShowCreateScheduleDialog: (state, action) => {
      state.showCreateScheduleDialog = action.payload;
    },
    setNotePostedData: (state, action) => {
      state.notePostedData = action.payload;
    },
    setHideFeedbackFab: (state, action) => {
      state.hideFeedbackFab = action.payload;
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
  setDidShowSaveTooltip,
  setShowScheduleModal,
  setShowExtensionDialog,
  setShowExtensionDisabledDialog,
  setShowNoSubstackCookiesDialog,
  setShowCreateScheduleDialog,
  setNotePostedData,
  setHideFeedbackFab,
} = uiSlice.actions;

export const selectUi = (state: RootState): UiState => state.ui;

export default uiSlice.reducer;
