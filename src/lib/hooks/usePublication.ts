import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  addPublication as addPublicationAction,
  setPublication,
} from "@/lib/features/publications/publicationSlice";
import axios from "axios";
import { Publication } from "@/types/publication";
import { Logger } from "@/logger";
import { Byline } from "@/types/article";
import { useRef } from "react";

export const usePublication = () => {
  const dispatch = useAppDispatch();
  const loadingAnalyze = useRef(false);

  const validatePublication = async (
    url: string,
  ): Promise<{
    valid: boolean;
    hasPublication: boolean;
  }> => {
    try {
      const res = await axios.get(`/api/user/analyze/validate?q=${url}`);
      return res.data;
    } catch (error: any) {
      Logger.error(error);
      return { valid: false, hasPublication: false };
    }
  };

  const analyzePublication = async (url: string, byline: Byline) => {
    if (loadingAnalyze.current) return;
    try {
      loadingAnalyze.current = true;
      const res = await axios.post<{ publication: Publication }>(
        "api/user/analyze",
        {
          url,
          byline,
        },
      );
      dispatch(setPublication(res.data.publication));
      return res.data;
    } catch (error: any) {
      Logger.error(error);
      throw error;
    } finally {
      loadingAnalyze.current = false;
    }
  };

  return {
    analyzePublication,
    validatePublication,
  };
};
