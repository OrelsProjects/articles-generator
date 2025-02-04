import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Idea, Outline } from "@/models/idea";

export interface PublicationState {
  publicationIds: string[];
  ideas: Idea[];
  outlines: { outline: Outline; idea: Idea }[];
}

export const initialState: PublicationState = {
  publicationIds: [],
  ideas: [],
  outlines: [],
};

const publicationSlice = createSlice({
  name: "publications",
  initialState,
  reducers: {
    addPublicationId: (state, action: PayloadAction<string>) => {
      state.publicationIds.push(action.payload);
    },
    setIdeas: (state, action: PayloadAction<Idea[]>) => {
      state.ideas = action.payload;
    },
    setOutlines: (state, action: PayloadAction<{ outline: Outline; idea: Idea }[]>) => {
      state.outlines = action.payload;
    },
    addIdeas: (state, action: PayloadAction<Idea[]>) => {
      state.ideas.push(...action.payload);
    },
    addOutline: (
      state,
      action: PayloadAction<{ outline: Outline; idea: Idea }>,
    ) => {
      state.outlines.push(action.payload);
    },
  },
});

export const { setIdeas, setOutlines, addIdeas, addOutline, addPublicationId } =
  publicationSlice.actions;

export default publicationSlice.reducer;
