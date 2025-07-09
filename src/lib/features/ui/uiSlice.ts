import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { CreatePostResponse } from "@/types/createPostResponse";

export interface UiState {
  state: "full" | "writing-mode";
  showIdeasPanel: boolean;
  showGenerateNotesSidebar: boolean;
  showAnalyzePublicationDialog: boolean;
  showGenerateIdeasDialog: boolean;
  showGenerateNotesDialog: {
    show: boolean;
    clientId: string | null;
  };
  sideBarState: "collapsed" | "expanded";
  didShowSaveTooltip: boolean;
  showScheduleModal: boolean;
  showExtensionDialog: boolean;
  showExtensionDisabledDialog: boolean;
  showNoSubstackCookiesDialog: boolean;
  showCreateScheduleDialog: {
    show: boolean;
    clientId: string | null;
  };
  notePostedData: CreatePostResponse | null;
  hideFeedbackFab: boolean;
}

export const initialState: UiState = {
  state: "writing-mode",
  showIdeasPanel: false,
  showGenerateNotesSidebar: false,
  showAnalyzePublicationDialog: false,
  showGenerateIdeasDialog: false,
  showGenerateNotesDialog: {
    show: false,
    clientId: null,
  },
  sideBarState: "expanded",
  didShowSaveTooltip: false,
  showScheduleModal: false,
  showExtensionDialog: false,
  showExtensionDisabledDialog: false,
  showNoSubstackCookiesDialog: false,
  showCreateScheduleDialog: {
    show: false,
    clientId: null,
  },
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
    setShowGenerateNotesDialog: (state, action) => {
      state.showGenerateNotesDialog.show = action.payload.show;
      state.showGenerateNotesDialog.clientId = action.payload.clientId;
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
      state.showCreateScheduleDialog.show = action.payload.show;
      state.showCreateScheduleDialog.clientId = action.payload.clientId;
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
  setShowGenerateNotesDialog,
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
