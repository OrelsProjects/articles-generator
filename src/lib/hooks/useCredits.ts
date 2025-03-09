import { useAppSelector } from "./redux";
import { selectSettings } from "@/lib/features/settings/settingsSlice";

export function useCredits() {
  const { credits } = useAppSelector(selectSettings);

  // Check if user has enough credits for an operation
  const hasEnoughCredits = (cost: number, creditType: 'article' | 'regular' = 'regular') => {
    if (creditType === 'article') {
      return credits.articleCredits.remaining >= cost;
    } else {
      return credits.regularCredits.remaining >= cost;
    }
  };

  return {
    credits,
    hasEnoughCredits,
  };
}
