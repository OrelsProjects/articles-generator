import { setUsages } from "@/lib/features/settings/settingsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "../features/auth/authSlice";
import { useMemo } from "react";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import axios from "axios";
import { selectPublications } from "@/lib/features/publications/publicationSlice";

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);
  const { publications } = useAppSelector(selectPublications);
  const { credits } = useAppSelector(selectSettings);

  const didExceedLimit = useMemo(() => {
    return credits.remaining <= 0;
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

  const plan = useMemo(() => user?.meta?.plan, [user?.meta?.plan]);

  const init = async () => {
    try {
      const response = await axios.get("/api/user/settings");
      const { usages } = response.data;
      dispatch(setUsages(usages));
    } catch (error) {}
  };

  // Check if user has enough credits for an operation
  const hasEnoughCredits = (cost: number) => {
    return credits.remaining >= cost;
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
