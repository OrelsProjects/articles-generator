import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Idea } from "@/models/idea";
import { Publication } from "@/models/publication";
import { RootState } from "@/lib/store";
import { IdeaStatus } from "@prisma/client";

export interface PublicationState {
  publications: Publication[];
  ideas: Idea[];
}

export const initialState: PublicationState = {
  publications: [],
  ideas: [],
};

const publicationSlice = createSlice({
  name: "publications",
  initialState,
  reducers: {
    addPublication: (state, action: PayloadAction<Publication>) => {
      state.publications.push(action.payload);
    },
    setIdeas: (state, action: PayloadAction<Idea[]>) => {
      state.ideas = action.payload;
    },
    addIdeas: (state, action: PayloadAction<Idea[]>) => {
      state.ideas.push(...action.payload);
    },
    updateStatus: (
      state,
      action: PayloadAction<{
        ideaId: string;
        status: IdeaStatus | "favorite";
      }>,
    ) => {
      const idea = state.ideas.find(idea => idea.id === action.payload.ideaId);
      if (idea) {
        if (action.payload.status === "favorite") {
          idea.isFavorite = !idea.isFavorite;
        } else {
          idea.status = action.payload.status;
        }
      }
    },
    updateIdea: (
      state,
      action: PayloadAction<{
        ideaId: string;
        outline: string;
        title: string;
        subtitle: string;
      }>,
    ) => {
      const idea = state.ideas.find(idea => idea.id === action.payload.ideaId);
      if (idea) {
        idea.outline = action.payload.outline;
        idea.title = action.payload.title;
        idea.subtitle = action.payload.subtitle;
      }
    },
  },
});

export const { setIdeas, addIdeas, addPublication, updateStatus, updateIdea } =
  publicationSlice.actions;

export const selectPublications = (state: RootState) => state.publications;

export default publicationSlice.reducer;
