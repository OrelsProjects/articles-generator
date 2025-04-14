import { setCancelAt, setUsages } from "@/lib/features/settings/settingsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "../features/auth/authSlice";
import { creditCosts } from "@/lib/plans-consts";
import { useMemo } from "react";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import axios from "axios";
import { selectPublications } from "@/lib/features/publications/publicationSlice";
import { AIUsageType, FeatureFlag } from "@prisma/client";
import { AllUsages } from "@/types/settings";
import { SubscriptionInfo } from "@/types/settings";

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);
  const { publications } = useAppSelector(selectPublications);
  const { credits } = useAppSelector(selectSettings);

  const didExceedLimit = useMemo(() => {
    return credits.remaining <= 0;
  }, [credits]);

  const hasPublication = useMemo(() => {
    return (
      publications.length > 0 &&
      publications.some(publication => !!publication.id)
    );
  }, [publications]);

  const init = async () => {
    try {
      try {
        await axios.post("/api/user/analyze/notes");
      } catch (error) {
        console.error(error);
      }
      const response = await axios.get<{
        usages: AllUsages;
        subscriptionInfo: SubscriptionInfo;
      }>("/api/user/settings");

      const { usages, subscriptionInfo } = response.data;
      dispatch(setUsages(usages));
      dispatch(setCancelAt(subscriptionInfo.cancelAt));
    } catch (error) {
      console.error(error);
    }
  };

  // Check if user has enough credits for an operation
  const hasEnoughCredits = (usageType: AIUsageType) => {
    if (!user?.meta?.plan) {
      return false;
    }
    const cost = creditCosts[usageType];
    if (!cost) {
      return false;
    }
    return credits.remaining >= cost;
  };

  return {
    init,
    didExceedLimit,
    hasPublication,
    hasEnoughCredits,
    credits,
  };
};
