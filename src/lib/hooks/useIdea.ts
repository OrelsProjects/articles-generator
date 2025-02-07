import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import {
  updateStatus as updateStatusAction,
  updateIdea as updateIdeaAction,
} from "@/lib/features/publications/publicationSlice";
import axios from "axios";
import { IdeaStatus } from "@prisma/client";

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
        status === "favorite"
          ? "isFavorite=true"
          : `status=${newStatus}`;
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

  return {
    updateStatus,
    updateIdea,
  };
};
