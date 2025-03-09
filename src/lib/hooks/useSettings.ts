import { setUsages } from "@/lib/features/settings/settingsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "../features/auth/authSlice";
import { creditsPerPlan } from "@/lib/plans-consts";
import { useMemo } from "react";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import axios from "axios";
import { selectPublications } from "@/lib/features/publications/publicationSlice";
import { AIUsageType } from "@prisma/client";

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);
  const { publications } = useAppSelector(selectPublications);
  const { credits } = useAppSelector(selectSettings);

  const didExceedLimit = useMemo(() => {
    // Check if both article and regular credits are depleted
    return (
      credits.articleCredits.remaining <= 0 &&
      credits.regularCredits.remaining <= 0
    );
  }, [credits]);

  const hasPublication = useMemo(() => {
    // Can have ideas in an empty publication
    return (
      publications.length > 0 &&
      publications.some(publication => !!publication.id)
    );
  }, [publications]);

  const canGenerateIdeas = useMemo(() => {
    return !didExceedLimit && hasPublication;
  }, [didExceedLimit, hasPublication]);

  const init = async () => {
    try {
      const response = await axios.get("/api/user/settings");
      const { usages } = response.data;
      dispatch(setUsages(usages));
    } catch (error) {}
  };

  // Check if user has enough credits for an operation
  const hasEnoughCredits = (
    creditType: AIUsageType,
  ) => {
    if (!user?.meta?.plan) {
      return false;
    }
    const cost = creditsPerPlan[user?.meta?.plan][creditType];
    if (creditType === "article") {
      return credits.articleCredits.remaining >= cost;
    } else {
      return credits.regularCredits.remaining >= cost;
    }
  };

  return {
    init,
    didExceedLimit,
    canGenerateIdeas,
    hasPublication,
    hasEnoughCredits,
    credits,
  };
};
