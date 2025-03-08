import { useAppSelector } from "./redux";
import { selectSettings } from "@/lib/features/settings/settingsSlice";

export function useCredits() {
  const { credits } = useAppSelector(selectSettings);

  // Check if user has enough credits for an operation
  const hasEnoughCredits = (cost: number) => {
    return credits.remaining >= cost;
  };

  return {
    credits,
    hasEnoughCredits,
  };
}
