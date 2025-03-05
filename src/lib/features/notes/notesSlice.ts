import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { Note, NoteDraft } from "@/types/note";

export interface NotesState {
  userNotes: NoteDraft[];
  inspirationNotes: Note[];
  selectedNote: NoteDraft | null;
  loading: boolean;
  error: string | null;
}

export const initialState: NotesState = {
  userNotes: [],
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
      state.userNotes = action.payload;
      state.loading = false;
      state.error = null;
    },
    addNote: (state, action: PayloadAction<Note>) => {
      state.userNotes.push(action.payload);
    },
    updateNote: (state, action: PayloadAction<Note>) => {
      let newNote = state.userNotes.find(note => note.id === action.payload.id);
      if (newNote) {
        newNote = {
          ...newNote,
          ...action.payload,
        };
        state.userNotes = state.userNotes.map(note =>
          note.id === action.payload.id && newNote ? newNote : note,
        );
      }
    },
    setInspirationNotes: (
      state,
      action: PayloadAction<Note[]>,
    ) => {
      state.inspirationNotes = action.payload;
    },
    addInspirationNotes: (
      state,
      action: PayloadAction<{
        notes: Note[];
        options?: { toStart: boolean };
      }>,
    ) => {
      debugger;
      if (action.payload.options?.toStart) {
        state.inspirationNotes = [
          ...action.payload.notes,
          ...state.inspirationNotes,
        ];
      } else {
        state.inspirationNotes.push(...action.payload.notes);
      }
    },
    addNotes: (
      state,
      action: PayloadAction<{
        notes: Note[];
        options?: { toStart: boolean };
      }>,
    ) => {
      if (action.payload.options?.toStart) {
        state.userNotes = [...action.payload.notes, ...state.userNotes];
      } else {
        state.userNotes.push(...action.payload.notes);
      }
    },
    setSelectedNote: (
      state,
      action: PayloadAction<Note | null>,
    ) => {
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
  addNotes,
  updateNote,
  setSelectedNote,
  setLoading,
  setError,
  setInspirationNotes,
  addInspirationNotes,
} = notesSlice.actions;

export const selectNotes = (state: RootState) => state.notes;

export default notesSlice.reducer;
