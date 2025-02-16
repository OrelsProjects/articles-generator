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
import { ImprovementType } from "@/lib/prompts";
import { Logger } from "@/logger";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

export const useIdea = () => {
  const [lastUsedIdea, setLastUsedIdea] = useLocalStorage<string | null>(
    "lastUsedIdea",
    null,
  );
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
    } catch (error: any) {
      Logger.error("Error updating idea status:", error);
      // revert optimistic update
      dispatch(updateStatusAction({ ideaId, status: idea.status }));
      throw error;
    }
  };

  const updateIdea = async (
    ideaId: string,
    body: string,
    title: string,
    subtitle: string,
  ) => {
    const idea = ideas.find(idea => idea.id === ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    // optimistic update
    dispatch(updateIdeaAction({ ideaId, body, title, subtitle }));
    try {
      await axios.patch(`/api/idea/${idea.id}`, {
        body,
        title,
        subtitle,
      });
    } catch (error: any) {
      Logger.error("Error updating idea:", error);
      // revert optimistic update
      dispatch(
        updateIdeaAction({
          ideaId,
          title: idea.title,
          body: idea.body,
          subtitle: idea.subtitle,
        }),
      );
      throw error;
    }
  };

  const setSelectedIdea = (idea: Idea) => {
    dispatch(setSelectedIdeaAction(idea));
    setLastUsedIdea(idea.id);
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
    } catch (error: any) {
      throw error;
    }
  };

  const setIdeas = (ideas: Idea[]) => {
    dispatch(setIdeasAction({ ideas, selectedIdeaId: lastUsedIdea || undefined }));
  };

  const addIdeas = (ideas: Idea[]) => {
    dispatch(addIdeasAction({ ideas, selectedIdeaId: lastUsedIdea || undefined }));
  };

  const improveText = async (
    text: string,
    type: ImprovementType,
    textFrom: number,
    textTo: number,
    ideaId: string,
  ): Promise<{ text: string; textFrom: number; textTo: number } | null> => {
    const res = await axios.post("/api/post/improve", {
      text,
      type,
      ideaId,
    });

    return res.data
      ? {
          text: res.data,
          textFrom,
          textTo,
        }
      : null;
  };

  return {
    updateStatus,
    updateIdea,
    setSelectedIdea,
    generateIdeas,
    setIdeas,
    addIdeas,
    improveText,
  };
};
