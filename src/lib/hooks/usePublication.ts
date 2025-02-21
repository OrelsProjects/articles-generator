import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  addPublication as addPublicationAction,
  setPublication,
} from "@/lib/features/publications/publicationSlice";
import axios from "axios";
import { Publication } from "@/types/publication";
import { Logger } from "@/logger";

export const usePublication = () => {
  const dispatch = useAppDispatch();

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

  const analyzePublication = async (url: string) => {
    try {
      const res = await axios.post<{ publication: Publication }>(
        "api/user/analyze",
        {
          url,
        },
      );
      dispatch(setPublication(res.data.publication));
      return res.data;
    } catch (error: any) {
      Logger.error(error);
      throw error;
    }
  };

  return {
    analyzePublication,
    validatePublication,
  };
};
