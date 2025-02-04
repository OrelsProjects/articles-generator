import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  setIdeas as setIdeasAction,
  setOutlines as setOutlinesAction,
  addIdeas as addIdeasAction,
  addOutline as addOutlineAction,
  addPublicationId as addPublicationIdAction,
} from "@/lib/features/publications/publicationSlice";
import { Outline } from "@/models/idea";
import { Idea } from "@/models/idea";
import axios from "axios";

export const usePublication = () => {
  const dispatch = useAppDispatch();
  const { outlines } = useAppSelector(state => state.publications);

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

  const generateOutline = async (idea: Idea) => {
    try {
      const outline = outlines.find(
        outline => outline.idea.title === idea.title,
      );
      if (outline) {
        return outline.outline;
      }
      const res = await axios.get("api/post/generate/outline", {
        params: {
          title: idea.title,
          subtitle: idea.subtitle,
        },
      });
      addOutline(res.data.outline, idea);
      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const generateIdeas = async () => {
    try {
      const res = await axios.get("api/post/generate/ideas");
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

  const setOutlines = (outlines: { outline: Outline; idea: Idea }[]) => {
    dispatch(setOutlinesAction(outlines));
  };

  const addIdeas = (ideas: Idea[]) => {
    dispatch(addIdeasAction(ideas));
  };

  const addOutline = (outline: Outline, idea: Idea) => {
    dispatch(addOutlineAction({ outline, idea }));
  };

  return {
    setIdeas,
    setOutlines,
    addIdeas,
    addOutline,
    generateOutline,
    generateIdeas,
    analyzePublication,
  };
};
