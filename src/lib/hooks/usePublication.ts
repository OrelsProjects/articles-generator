import { useAppDispatch } from "@/lib/hooks/redux";
import { setPublication } from "@/lib/features/publications/publicationSlice";
import axiosInstance from "@/lib/axios-instance";
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
    validUrl?: string;
    hasPublication: boolean;
  }> => {
    try {
      const res = await axiosInstance.post(`/api/user/analyze/validate`, {
        url,
      });

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
      const [analysisPublication] = await Promise.all([
        axiosInstance.post<{ publication: Publication }>("api/user/analyze", {
          url,
          byline,
        }),
      ]);
      dispatch(setPublication(analysisPublication.data.publication));
      axiosInstance.post("/api/user/analyze/notes", {
        authorId: byline.authorId,
        userTriggered: false,
      });
    } catch (error: any) {
      try {
        // Sometimes there's an error, but the publication analysis is still created
        await axiosInstance.post("/api/user/publications/validate-analysis");
      } catch (errorValidate: any) {
        Logger.error(errorValidate);
        throw error;
      }
    } finally {
      loadingAnalyze.current = false;
    }
  };

  return {
    analyzePublication,
    validatePublication,
  };
};
