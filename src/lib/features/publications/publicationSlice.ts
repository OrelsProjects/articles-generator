import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Idea } from "@/models/idea";

export interface PublicationState {
  publicationIds: string[];
  ideas: Idea[];
}

export const initialState: PublicationState = {
  publicationIds: [],
  ideas: [],
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
    addIdeas: (state, action: PayloadAction<Idea[]>) => {
      state.ideas.push(...action.payload);
    },
  },
});

export const { setIdeas, addIdeas, addPublicationId } =
  publicationSlice.actions;

export default publicationSlice.reducer;
