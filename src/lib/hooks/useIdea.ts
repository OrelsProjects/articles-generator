import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  updateStatus as updateStatusAction,
  updateIdea as updateIdeaAction,
  setSelectedIdea as setSelectedIdeaAction,
  setIdeas as setIdeasAction,
  addIdeas as addIdeasAction,
} from "@/lib/features/publications/publicationSlice";
import axios from "axios";
import { IdeaStatus } from "@prisma/client";
import { Idea } from "@/types/idea";

export const useIdea = () => {
  const dispatch = useAppDispatch();
  const { ideas } = useAppSelector(state => state.publications);
  const updateStatus = async (
    ideaId: string,
    status: IdeaStatus | "favorite",
  ) => {
    let newStatus = status;
    const idea = ideas.find(idea => idea.id === ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    if (idea.status === status) {
      newStatus = "new";
    }
    // optimistic update
    dispatch(updateStatusAction({ ideaId, status: newStatus }));
    try {
      const searchParamsStatus =
        status === "favorite" ? "isFavorite=true" : `status=${newStatus}`;
      await axios.patch(`/api/idea/${idea.id}/status?${searchParamsStatus}`);
    } catch (error) {
      console.error(error);
      // revert optimistic update
      dispatch(updateStatusAction({ ideaId, status: idea.status }));
      throw error;
    }
  };

  const updateIdea = async (
    ideaId: string,
    outline: string,
    title: string,
    subtitle: string,
  ) => {
    const idea = ideas.find(idea => idea.id === ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    // optimistic update
    dispatch(updateIdeaAction({ ideaId, outline, title, subtitle }));
    try {
      await axios.patch(`/api/idea/${idea.id}/outline`, {
        outline,
        title,
        subtitle,
      });
    } catch (error) {
      console.error(error);
      // revert optimistic update
      dispatch(
        updateIdeaAction({
          ideaId,
          outline: idea.outline,
          title: idea.title,
          subtitle: idea.subtitle,
        }),
      );
      throw error;
    }
  };

  const setSelectedIdea = (idea: Idea) => {
    dispatch(setSelectedIdeaAction(idea));
  };

  const generateIdeas = async (
    options: { topic?: string; ideasCount?: number; shouldSearch?: boolean } = {
      shouldSearch: false,
    },
  ): Promise<Idea[]> => {
    try {
      const res = await axios.get<Idea[]>(
        `api/post/generate/ideas?topic=${options.topic}&ideasCount=${options.ideasCount || 3}&shouldSearch=${options.shouldSearch}`,
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
    updateStatus,
    updateIdea,
    setSelectedIdea,
    generateIdeas,
    setIdeas,
    addIdeas,
  };
};
