import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { Note, NoteDraft, NoteStatus } from "@/types/note";

export interface NotesState {
  userNotes: NoteDraft[];
  inspirationNotes: Note[];
  selectedNote: (NoteDraft & { isFromInspiration?: boolean }) | null;
  selectedImage: { url: string; alt: string } | null;
  loadingNotes: boolean;
  loadingInspiration: boolean;
  error: string | null;
  hasMoreUserNotes: boolean;
  hasMoreInspirationNotes: boolean;
  userNotesCursor: string | null;
  inspirationNotesCursor: string | null;
  hasNewNotes: boolean;
}

export const initialState: NotesState = {
  userNotes: [],
  inspirationNotes: [],
  selectedNote: null,
  selectedImage: null,
  loadingNotes: false,
  loadingInspiration: false,
  error: null,
  hasMoreUserNotes: true,
  hasMoreInspirationNotes: true,
  userNotesCursor: null,
  inspirationNotesCursor: null,
  hasNewNotes: false,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    setNotes: (
      state,
      action: PayloadAction<{ items: NoteDraft[]; nextCursor: string | null }>,
    ) => {
      state.userNotes = action.payload.items;
      state.userNotesCursor = action.payload.nextCursor;
      state.hasMoreUserNotes = !!action.payload.nextCursor;
      state.loadingNotes = false;
      state.error = null;
    },
    addNote: (state, action: PayloadAction<NoteDraft>) => {
      state.userNotes.push(action.payload);
    },
    updateNote: (
      state,
      action: PayloadAction<{ id: string; note: Partial<NoteDraft> }>,
    ) => {
      const { id, note } = action.payload;
      let newNote = state.userNotes.find(userNote => userNote.id === id);
      if (newNote) {
        newNote = {
          ...newNote,
          ...note,
        };
        state.userNotes = state.userNotes.map(userNote =>
          userNote.id === id && newNote ? newNote : userNote,
        );
        if (id === state.selectedNote?.id) {
          state.selectedNote = newNote;
        }
      }
    },
    removeNote: (state, action: PayloadAction<string>) => {
      state.userNotes = state.userNotes.filter(
        userNote => userNote.id !== action.payload,
      );
    },
    setInspirationNotes: (
      state,
      action: PayloadAction<{ items: Note[]; nextCursor: string | null }>,
    ) => {
      state.inspirationNotes = action.payload.items;
      state.inspirationNotesCursor = action.payload.nextCursor;
      state.hasMoreInspirationNotes = !!action.payload.nextCursor;
    },
    addInspirationNotes: (
      state,
      action: PayloadAction<{
        items: Note[];
        nextCursor: string | null;
        hasMore: boolean;
        options?: { toStart: boolean; notification?: boolean };
      }>,
    ) => {
      if (action.payload.options?.toStart) {
        state.inspirationNotes = [
          ...action.payload.items,
          ...state.inspirationNotes,
        ];
      } else {
        state.inspirationNotes.push(...action.payload.items);
      }
      state.inspirationNotesCursor = action.payload.nextCursor;
      state.hasMoreInspirationNotes = action.payload.hasMore;
      if (action.payload.options?.notification) {
        state.hasNewNotes = true;
      }
    },
    resetNotification: state => {
      state.hasNewNotes = false;
    },
    addNotes: (
      state,
      action: PayloadAction<{
        items: NoteDraft[];
        nextCursor: string | null;
        options?: { toStart: boolean };
      }>,
    ) => {
      if (action.payload.options?.toStart) {
        state.userNotes = [...action.payload.items, ...state.userNotes];
      } else {
        state.userNotes.push(...action.payload.items);
      }
      state.userNotesCursor = action.payload.nextCursor;
      state.hasMoreUserNotes = !!action.payload.nextCursor;
    },
    setSelectedNote: (
      state,
      action: PayloadAction<{
        note: NoteDraft | null;
        isFromInspiration?: boolean;
      }>,
    ) => {
      state.selectedNote = action.payload.note;
      if (action.payload.isFromInspiration && state.selectedNote) {
        state.selectedNote = {
          ...state.selectedNote,
          isFromInspiration: true,
        };
      }
    },
    setSelectedImage: (
      state,
      action: PayloadAction<{ url: string; alt: string } | null>,
    ) => {
      state.selectedImage = action.payload;
    },
    setLoadingNotes: (state, action: PayloadAction<boolean>) => {
      state.loadingNotes = action.payload;
    },
    setLoadingInspiration: (state, action: PayloadAction<boolean>) => {
      state.loadingInspiration = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loadingNotes = false;
    },
  },
});

export const {
  setNotes,
  addNote,
  addNotes,
  updateNote,
  setSelectedNote,
  setSelectedImage,
  setLoadingNotes,
  setLoadingInspiration,
  setError,
  setInspirationNotes,
  addInspirationNotes,
  removeNote,
  resetNotification,
} = notesSlice.actions;

export const selectNotes = (state: RootState) => state.notes;

export default notesSlice.reducer;
