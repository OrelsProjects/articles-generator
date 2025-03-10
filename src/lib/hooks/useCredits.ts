import { AIUsageType } from "@prisma/client";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  decrementUsage,
  selectSettings,
} from "@/lib/features/settings/settingsSlice";

export function useCredits() {
  const dispatch = useAppDispatch();
  const { credits } = useAppSelector(selectSettings);

  // Check if user has enough credits for an operation
  const hasEnoughCredits = (cost: number) => {
    return credits.remaining >= cost;
  };

  const consumeCredits = async (cost: number) => {
    // if cost is negative, make it positive
    if (cost < 0) {
      cost = -cost;
    }

    dispatch(decrementUsage({ amount: cost }));
  };

  return {
    credits,
    consumeCredits,
    hasEnoughCredits,
  };
}
