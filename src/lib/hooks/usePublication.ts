import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  setIdeas as setIdeasAction,
  addIdeas as addIdeasAction,
  addPublicationId as addPublicationIdAction,
} from "@/lib/features/publications/publicationSlice";
import { Idea } from "@/models/idea";
import axios from "axios";

export const usePublication = () => {
  const dispatch = useAppDispatch();

  const analyzePublication = async (url: string) => {
    try {
      const res = await axios.post<{ publicationId: string }>(
        "api/user/analyze",
        {
          url,
        },
      );
      dispatch(addPublicationIdAction(res.data.publicationId));
      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const generateIdeas = async (topic?: string): Promise<Idea[]> => {
    try {
      const res = await axios.get<Idea[]>(
        `api/post/generate/ideas?topic=${topic}`,
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
