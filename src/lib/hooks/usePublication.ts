import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  setIdeas as setIdeasAction,
  addIdeas as addIdeasAction,
  addPublication as addPublicationAction,
} from "@/lib/features/publications/publicationSlice";
import { Idea } from "@/models/idea";
import axios from "axios";
import { Publication } from "@/models/publication";

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
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const generateIdeas = async (
    topic?: string,
    ideasCount = 3,
  ): Promise<Idea[]> => {
    try {
      const res = await axios.get<Idea[]>(
        `api/post/generate/ideas?topic=${topic}&ideasCount=${ideasCount}`,
      );
      addIdeas(res.data);
      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const setIdeas = (ideas: Idea[]) => {
    dispatch(setIdeasAction(ideas));
  };

  const addIdeas = (ideas: Idea[]) => {
    dispatch(addIdeasAction(ideas));
  };

  return {
    setIdeas,
    addIdeas,
    generateIdeas,
    analyzePublication,
  };
};
