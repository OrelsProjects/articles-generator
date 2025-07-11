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
  analysisError: ErrorState | null;
}

export interface ErrorState {
  value: string;
  type: "error" | "warn";
  explanation: string;
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
  analysisError: null,
};

const publicationSlice = createSlice({
  name: "publications",
  initialState,
  reducers: {
    setPublication: (state, action: PayloadAction<Publication>) => {
      state.publications[0] = {
        ...state.publications[0],
        ...action.payload,
      };
    },
    addPublication: (state, action: PayloadAction<Publication>) => {
      state.publications.push(action.payload);
    },
    setIdeas: (
      state,
      action: PayloadAction<{
        ideas: Idea[];
        selectedIdeaId?: string;
      }>,
    ) => {
      state.ideas = action.payload.ideas;
      state.selectedIdea =
        state.ideas.find(idea => idea.id === action.payload.selectedIdeaId) ||
        getFirstIdea(action.payload.ideas);
    },
    addIdeas: (
      state,
      action: PayloadAction<{
        ideas: Idea[];
        selectedIdeaId?: string;
      }>,
    ) => {
      state.ideas.push(...action.payload.ideas);
      state.selectedIdea =
        state.ideas.find(idea => idea.id === action.payload.selectedIdeaId) ||
        getFirstIdea(action.payload.ideas);
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
    replaceTempIdea: (state, action: PayloadAction<Idea>) => {
      let wasTempIdeaSelected = false;
      if (state.selectedIdea?.id === "temp-id") {
        wasTempIdeaSelected = true;
      }
      state.ideas = state.ideas.map(idea =>
        idea.id === "temp-id" ? { ...idea, id: action.payload.id } : idea,
      );
      if (wasTempIdeaSelected) {
        state.selectedIdea = action.payload;
      }
    },
    removeTempIdea: state => {
      state.ideas = state.ideas.filter(idea => idea.id !== "temp-id");
    },
    setSelectedIdea: (state, action: PayloadAction<Idea | null>) => {
      state.selectedIdea = action.payload;
    },
    setLoadingNewIdeas: (state, action: PayloadAction<boolean>) => {
      state.loadingNewIdeas = action.payload;
    },
    setAnalysisError: (state, action: PayloadAction<ErrorState | null>) => {
      state.analysisError = action.payload;
    },
  },
});

export const {
  setIdeas,
  addIdeas,
  setPublication,
  addPublication,
  updateStatus,
  updateIdea,
  setSelectedIdea,
  setLoadingNewIdeas,
  replaceTempIdea,
  removeTempIdea,
  setAnalysisError,
} = publicationSlice.actions;

export const selectPublications = (state: RootState) => state.publications;

export default publicationSlice.reducer;
