import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  selectUi,
  setDidShowSaveTooltip,
  setShowCreateScheduleDialog,
  setShowGenerateNotesSidebar,
  setShowGenerateNotesDialog,
  setShowScheduleModal,
  setSideBarState,
  setUiState,
} from "@/lib/features/ui/uiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { FeatureFlag } from "@prisma/client";

export function useUi() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);
  const { showGenerateNotesSidebar } = useAppSelector(selectUi);

  const setState = (state: "full" | "writing-mode") => {
    dispatch(setUiState(state));
  };

  const updateShowGenerateNotesSidebar = (show: boolean) => {
    dispatch(setShowGenerateNotesSidebar(show));
  };

  const updateSideBarState = (state: "collapsed" | "expanded") => {
    dispatch(setSideBarState(state));
  };

  const updateDidShowSaveTooltip = (didShow: boolean) => {
    dispatch(setDidShowSaveTooltip(didShow));
  };

  const updateShowScheduleModal = (show: boolean) => {
    dispatch(setShowScheduleModal(show));
  };

  const updateShowCreateScheduleDialog = (show: boolean) => {
    dispatch(setShowCreateScheduleDialog(show));
  };

  const updateShowGenerateNotesDialog = (show: boolean) => {
    dispatch(setShowGenerateNotesDialog(show));
  };


  const showGenerateNotesDialog = useAppSelector(selectUi).showGenerateNotesDialog;

  const hasAdvancedGPT = user?.meta?.featureFlags.includes(
    FeatureFlag.advancedGPT,
  );

  const hasAdvancedFiltering = user?.meta?.featureFlags.includes(
    FeatureFlag.advancedFiltering,
  );

  const hasPopulateNotes = user?.meta?.featureFlags.includes(
    FeatureFlag.populateNotes,
  );

  const hasViewWriter = user?.meta?.featureFlags.includes(
    FeatureFlag.canViewWriters,
  );

  const didShowSaveTooltip = useAppSelector(selectUi).didShowSaveTooltip;

  const showScheduleModal = useAppSelector(selectUi).showScheduleModal;

  const showCreateScheduleDialog = useAppSelector(selectUi).showCreateScheduleDialog;

  const canScheduleNotes = user?.meta?.featureFlags.includes(
    FeatureFlag.scheduleNotes,
  );

  const canAutoDM = user?.meta?.featureFlags.includes(
    FeatureFlag.canAutoDM,
  );

  const canUseChat = user?.meta?.featureFlags.includes(
    FeatureFlag.chat,
  );

  return {
    setState,
    hasAdvancedGPT,
    showGenerateNotesSidebar,
    updateShowGenerateNotesSidebar,
    hasAdvancedFiltering,
    updateSideBarState,
    updateDidShowSaveTooltip,
    didShowSaveTooltip,
    hasPopulateNotes,
    showScheduleModal,
    updateShowScheduleModal,
    updateShowCreateScheduleDialog,
    showCreateScheduleDialog,
    canScheduleNotes,
    canAutoDM,
    canUseChat,
    hasViewWriter,
    showGenerateNotesDialog,
    updateShowGenerateNotesDialog,
  };
}
