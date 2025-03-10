import {
  selectUi,
  setShowGenerateNotesSidebar,
  setUiState,
} from "@/lib/features/ui/uiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";

export function useUi() {
  const dispatch = useAppDispatch();
  const { showGenerateNotesSidebar } = useAppSelector(selectUi);

  const setState = (state: "full" | "writing-mode") => {
    dispatch(setUiState(state));
  };

  const updateShowGenerateNotesSidebar = (show: boolean) => {
    dispatch(setShowGenerateNotesSidebar(show));
  };

  return { setState, showGenerateNotesSidebar, updateShowGenerateNotesSidebar };
}
