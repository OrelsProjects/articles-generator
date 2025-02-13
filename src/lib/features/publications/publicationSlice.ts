import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Idea } from "@/types/idea";
import { Publication } from "@/types/publication";
import { RootState } from "@/lib/store";
import { IdeaStatus } from "@prisma/client";

export interface PublicationState {
  publications: Publication[];
  ideas: Idea[];
  selectedIdea: Idea | null;
  loadingNewIdeas: boolean;
}

const getFirstIdea = (ideas: Idea[]) => {
  const newIdeas = ideas.filter(idea => idea.status === "new");
  return newIdeas.length > 0 ? newIdeas[0] : ideas[0];
};

export const initialState: PublicationState = {
  publications: [],
  ideas: [],
  selectedIdea: null,
  loadingNewIdeas: false,
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
      if (!state.selectedIdea) {
        state.selectedIdea = getFirstIdea(action.payload);
      }
    },
    addIdeas: (state, action: PayloadAction<Idea[]>) => {
      state.ideas.push(...action.payload);
      if (!state.selectedIdea) {
        state.selectedIdea = getFirstIdea(action.payload);
      }
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
        title: string;
        subtitle: string;
        body: string;
      }>,
    ) => {
      const idea = state.ideas.find(idea => idea.id === action.payload.ideaId);
      if (idea) {
        idea.title = action.payload.title;
        idea.subtitle = action.payload.subtitle;
        idea.body = action.payload.body;
      }
    },
    setSelectedIdea: (state, action: PayloadAction<Idea | null>) => {
      state.selectedIdea = action.payload;
    },
    setLoadingNewIdeas: (state, action: PayloadAction<boolean>) => {
      state.loadingNewIdeas = action.payload;
    },
  },
});

export const {
  setIdeas,
  addIdeas,
  addPublication,
  updateStatus,
  updateIdea,
  setSelectedIdea,
  setLoadingNewIdeas,
} = publicationSlice.actions;

export const selectPublications = (state: RootState) => state.publications;

export default publicationSlice.reducer;
