import {
  setCancelAt,
  setGeneratingDescription,
  setUsages,
} from "@/lib/features/settings/settingsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "../features/auth/authSlice";
import { creditCosts } from "@/lib/plans-consts";
import { useCallback, useEffect, useMemo } from "react";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import axiosInstance from "@/lib/axios-instance";
import { selectPublications } from "@/lib/features/publications/publicationSlice";
import { AIUsageType } from "@prisma/client";
import { AllUsages, Settings } from "@/types/settings";
import { SubscriptionInfo } from "@/types/settings";
import { Logger } from "@/logger";

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
      axiosInstance
        .post("/api/user/analyze/notes", {
          userTriggered: false,
        })
        .catch(error => {
          Logger.error(error);
        });

      const response = await axiosInstance.get<{
        usages: AllUsages;
        subscriptionInfo: SubscriptionInfo;
        settings: Settings;
      }>("/api/user/settings");

      const { usages, subscriptionInfo, settings } = response.data;
      dispatch(setUsages(usages));
      dispatch(setCancelAt(subscriptionInfo.cancelAt));
      dispatch(setGeneratingDescription(settings.generatingDescription));
    } catch (error: any) {
      Logger.error("Error initializing settings", { error });
    }
  };

  const shouldShow50PercentOffOnCancel = useCallback(async () => {
    try {
      const response = await axiosInstance.get<{
        isDiscountAvailable: boolean;
      }>("/api/user/settings/discount/before-cancel");
      return response.data.isDiscountAvailable;
    } catch (error: any) {
      Logger.error("Error checking if user should see 50% off on cancel", {
        error,
      });
      return false;
    }
  }, []);

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

  const updatePreferredLanguage = async (language: string) => {
    try {
      await axiosInstance.post("/api/v1/user/settings/language", {
        language,
      });
      return true;
    } catch (error: any) {
      Logger.error("Error updating preferred language", { error });
      return false;
    }
  };

  const updateName = async (name: string) => {
    try {
      await axiosInstance.patch("api/v1/user/settings/name", {
        name,
      });
      return true;
    } catch (error: any) {
      Logger.error("Error updating preferred language", { error });
      throw error;
    }
  };

  useEffect(() => {
    if (user?.meta?.plan) {
      init();
    }
  }, [user?.meta?.plan]);

  return {
    init,
    didExceedLimit,
    hasPublication,
    hasEnoughCredits,
    credits,
    shouldShow50PercentOffOnCancel,
    updatePreferredLanguage,
    updateName,
  };
};
