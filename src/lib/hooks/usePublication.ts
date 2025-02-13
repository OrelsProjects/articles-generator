import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  setIdeas as setIdeasAction,
  addIdeas as addIdeasAction,
  addPublication as addPublicationAction,
} from "@/lib/features/publications/publicationSlice";
import { Idea } from "@/types/idea";
import axios from "axios";
import { Publication } from "@/types/publication";
import { Logger } from "@/logger";

export const usePublication = () => {
  const dispatch = useAppDispatch();

  const analyzePublication = async (url: string) => {
    try {
      const res = await axios.post<{ publication: Publication }>(
        "api/user/analyze",
        {
          url,
        },
      );
      dispatch(addPublicationAction(res.data.publication));
      return res.data;
    } catch (error: any) {
      Logger.error(error);
      throw error;
    }
  };

  return {
    analyzePublication,
  };
};
