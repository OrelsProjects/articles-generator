import { setUsages } from "@/lib/features/settings/settingsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "../features/auth/authSlice";
import {
  maxIdeasPerPlan,
  maxTitleAndSubtitleRefinementsPerPlan,
  maxTextEnhancmentsPerPlan,
  textEditorTypePerPlan,
  canUseSearchPerPlan,
} from "@/lib/plans-consts";
import { useMemo } from "react";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import axios from "axios";

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);
  const { usage } = useAppSelector(selectSettings);

  const didExceedLimit = useMemo(() => {
    return usage.ideaGeneration.didExceed;
  }, [usage]);

  const maxIdeas = useMemo(
    () => maxIdeasPerPlan[user?.meta?.plan || "free"],
    [user?.meta?.plan],
  );

  const canUseSearch = useMemo(
    () => canUseSearchPerPlan[user?.meta?.plan || "free"],
    [user?.meta?.plan],
  );

  const maxTitleAndSubtitleRefinements = useMemo(
    () => maxTitleAndSubtitleRefinementsPerPlan[user?.meta?.plan || "free"],
    [user?.meta?.plan],
  );

  const maxTextEnhancments = useMemo(
    () => maxTextEnhancmentsPerPlan[user?.meta?.plan || "free"],
    [user?.meta?.plan],
  );

  const textEditorType = useMemo(
    () => textEditorTypePerPlan[user?.meta?.plan || "free"],
    [user?.meta?.plan],
  );

  const init = async () => {
    try {
      const response = await axios.get("/api/user/settings");
      const { usages } = response.data;
      dispatch(setUsages(usages));
    } catch (error) {}
  };

  return { init,     maxIdeas,
    canUseSearch,
    didExceedLimit,
    maxTitleAndSubtitleRefinements,
    maxTextEnhancments,
    textEditorType, };
};
