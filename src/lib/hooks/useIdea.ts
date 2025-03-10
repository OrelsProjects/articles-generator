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
import { decrementUsage } from "@/lib/features/settings/settingsSlice";
import { setShowIdeasPanel } from "@/lib/features/ui/uiSlice";
import { AIUsageResponse } from "@/types/aiUsageResponse";
import { EventTracker } from "@/eventTracker";

export const useIdea = () => {
  const { ideas, selectedIdea } = useAppSelector(state => state.publications);
  const [lastUsedIdea, setLastUsedIdea] = useLocalStorage<string | null>(
    "lastUsedIdea",
    null,
  );
  const dispatch = useAppDispatch();

  const updateStatus = async (
    ideaId: string,
    status: IdeaStatus | "favorite",
  ) => {
    EventTracker.track("idea_update_status_" + status);
    let newStatus = status;
    let didReplaceSelectedIdea = false;
    const idea = ideas.find(idea => idea.id === ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    if (idea.status === status) {
      newStatus = "new";
    }
    // optimistic update
    dispatch(updateStatusAction({ ideaId, status: newStatus }));
    if (status === "archived" && selectedIdea?.id === ideaId) {
      didReplaceSelectedIdea = true;
      // Select next idea in the list
      const nextIdea = ideas.find(
        idea => idea.status !== "archived" && idea.id !== ideaId,
      );
      if (nextIdea) {
        dispatch(setSelectedIdeaAction(nextIdea));
      } else {
        dispatch(setSelectedIdeaAction(null));
      }
    } else {
      if (!selectedIdea) {
        dispatch(setSelectedIdeaAction(idea));
      }
    }

    try {
      const searchParamsStatus =
        status === "favorite" ? "isFavorite=true" : `status=${newStatus}`;
      await axios.patch(`/api/idea/${idea.id}/status?${searchParamsStatus}`);
    } catch (error: any) {
      Logger.error("Error updating idea status:", error);
      // revert optimistic update
      dispatch(updateStatusAction({ ideaId, status: idea.status }));
      if (didReplaceSelectedIdea) {
        dispatch(setSelectedIdeaAction(idea));
      }
      throw error;
    }
  };

  const updateIdea = async (
    ideaId: string,
    body: string,
    title: string,
    subtitle: string,
  ) => {
    EventTracker.track("idea_update_idea");
    const idea = ideas.find(idea => idea.id === ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }
    // optimistic update
    try {
      await axios.patch(`/api/idea/${idea.id}`, {
        body,
        title,
        subtitle,
      });
      dispatch(updateIdeaAction({ ideaId, body, title, subtitle }));
    } catch (error: any) {
      Logger.error("Error updating idea:", error);
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
    EventTracker.track("idea_generate_ideas");
    try {
      const res = await axios.get<AIUsageResponse<Idea[]>>(
        `api/post/generate/ideas?topic=${options.topic}&ideasCount=${options.ideasCount || 3}&shouldSearch=${options.shouldSearch}`,
      );
      const { responseBody } = res.data;
      if (!responseBody) {
        throw new Error("No ideas generated");
      }
      const { body, creditsUsed } = responseBody;
      addIdeas(body);

      dispatch(decrementUsage({ amount: creditsUsed }));
      return body;
    } catch (error: any) {
      throw error;
    }
  };

  const setIdeas = (ideas: Idea[]) => {
    dispatch(
      setIdeasAction({ ideas, selectedIdeaId: lastUsedIdea || undefined }),
    );
  };

  const addIdeas = (ideas: Idea[]) => {
    dispatch(
      addIdeasAction({ ideas, selectedIdeaId: lastUsedIdea || undefined }),
    );
  };

  const improveText = async (
    text: string,
    type: ImprovementType,
    textFrom: number,
    textTo: number,
    ideaId: string,
  ): Promise<{ text: string; textFrom: number; textTo: number } | null> => {
    EventTracker.track("idea_improve_text_" + type, {
      length: text.length,
    });
    const res = await axios.post<AIUsageResponse<string>>("/api/post/improve", {
      text,
      type,
      ideaId,
    });
    const { responseBody } = res.data;
    if (!responseBody) {
      throw new Error("No text improved");
    }
    const { body, creditsUsed } = responseBody;

    dispatch(decrementUsage({ amount: creditsUsed }));

    return body
      ? {
          text: body,
          textFrom,
          textTo,
        }
      : null;
  };

  const improveTitle = async (
    menuType: "title" | "subtitle",
    improveType: string,
    ideaId: string,
    value: string,
  ): Promise<{ title: string; subtitle: string }> => {
    EventTracker.track("idea_improve_title_" + menuType, {
      improveType,
      ideaId,
      value,
    });
    const res = await axios.post<
      AIUsageResponse<{ title: string; subtitle: string }>
    >("/api/post/improve/title", {
      menuType,
      improveType,
      ideaId,
      value,
    });
    const { responseBody } = res.data;
    if (!responseBody) {
      throw new Error("Improvement service failed.");
    }
    const { body, creditsUsed } = responseBody;

    dispatch(decrementUsage({ amount: creditsUsed }));
    return body;
  };

  const createNewIdea = async (options?: { showIdeasAfterCreate: boolean }) => {
    EventTracker.track("idea_create_new_idea");
    try {
      const res = await axios.post("/api/idea");
      addIdeas([res.data]);
      setSelectedIdea(res.data);
      setLastUsedIdea(res.data.id);
      if (options?.showIdeasAfterCreate) {
        dispatch(setShowIdeasPanel(true));
      }
      return res.data;
    } catch (error: any) {
      throw error;
    }
  };

  return {
    updateStatus,
    updateIdea,
    setSelectedIdea,
    generateIdeas,
    setIdeas,
    addIdeas,
    improveText,
    improveTitle,
    createNewIdea,
  };
};
