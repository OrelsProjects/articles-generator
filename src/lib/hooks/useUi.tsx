import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  selectUi,
  setDidShowSaveTooltip,
  setShowGenerateNotesSidebar,
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

  const hasAdvancedGPT = user?.meta?.featureFlags.includes(
    FeatureFlag.advancedGPT,
  );

  const hasAdvancedFiltering = user?.meta?.featureFlags.includes(
    FeatureFlag.advancedFiltering,
  );

  const hasPopulateNotes = user?.meta?.featureFlags.includes(
    FeatureFlag.populateNotes,
  );

  const didShowSaveTooltip = useAppSelector(selectUi).didShowSaveTooltip;

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
  };
}
