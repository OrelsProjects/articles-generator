import { setUiState } from "@/lib/features/ui/uiSlice";
import { useAppDispatch } from "@/lib/hooks/redux";

export function useUi() {
  const dispatch = useAppDispatch();

  const setState = (state: "full" | "writing-mode") => {
    dispatch(setUiState(state));
  };

  return { setState };
}
