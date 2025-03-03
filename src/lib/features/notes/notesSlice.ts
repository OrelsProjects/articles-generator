import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Note } from "@/types/note";
import { RootState } from "@/lib/store";
import { NotesComments } from "../../../../prisma/generated/articles";
import { NoteCommentWithAttachment } from "@/types/note";

export interface NotesState {
  notes: Note[];
  inspirationNotes: NoteCommentWithAttachment[];
  selectedNote: Note | null;
  loading: boolean;
  error: string | null;
}

export const initialState: NotesState = {
  notes: [],
  inspirationNotes: [],
  selectedNote: null,
  loading: false,
  error: null,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    setNotes: (state, action: PayloadAction<Note[]>) => {
      state.notes = action.payload;
      state.loading = false;
      state.error = null;
    },
    addNote: (state, action: PayloadAction<Note>) => {
      state.notes.push(action.payload);
    },
    updateNote: (
      state,
      action: PayloadAction<{
        noteId: string;
        title: string;
        content: string;
      }>,
    ) => {
      const note = state.notes.find(note => note.id === action.payload.noteId);
      if (note) {
        note.title = action.payload.title;
        note.content = action.payload.content;
      }
    },
    setInspirationNotes: (
      state,
      action: PayloadAction<NoteCommentWithAttachment[]>,
    ) => {
      state.inspirationNotes = action.payload;
    },
    addInspirationNotes: (
      state,
      action: PayloadAction<NoteCommentWithAttachment[]>,
    ) => {
      debugger;
      state.inspirationNotes.push(...action.payload);
    },
    setSelectedNote: (state, action: PayloadAction<Note | null>) => {
      state.selectedNote = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setNotes,
  addNote,
  updateNote,
  setSelectedNote,
  setLoading,
  setError,
  setInspirationNotes,
  addInspirationNotes,
} = notesSlice.actions;

export const selectNotes = (state: RootState) => state.notes;

export default notesSlice.reducer;
