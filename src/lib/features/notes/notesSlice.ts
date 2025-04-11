import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { Note, NoteDraft, NoteDraftImage } from "@/types/note";
import { Filter } from "@/lib/dal/milvus";
import { UserSchedule } from "@/types/schedule";

export interface NotesState {
  userNotes: NoteDraft[];
  inspirationNotes: Note[];
  selectedNote: (NoteDraft & { isFromInspiration?: boolean }) | null;
  inspirationFilters: Filter[];
  selectedImage: { url: string; alt: string } | null;
  loadingNotes: boolean;
  loadingNotesGenerate: boolean;
  loadingInspiration: boolean;
  loadingFetchingByline: boolean;
  error: string | null;
  errorGenerateNotes: string | null;
  hasMoreUserNotes: boolean;
  hasMoreInspirationNotes: boolean;
  userNotesCursor: string | null;
  inspirationNotesCursor: string | null;
  hasNewNotes: boolean;
  handle: string | null;
  thumbnail: string | null;
  name: string | null;
  userSchedules: UserSchedule[];
}

export const initialState: NotesState = {
  userNotes: [],
  inspirationNotes: [],
  inspirationFilters: [],
  userSchedules: [],
  selectedNote: null,
  selectedImage: null,
  loadingNotes: false,
  loadingNotesGenerate: false,
  loadingInspiration: false,
  loadingFetchingByline: false,
  error: null,
  errorGenerateNotes: null,
  hasMoreUserNotes: true,
  hasMoreInspirationNotes: true,
  userNotesCursor: null,
  inspirationNotesCursor: null,
  hasNewNotes: false,
  handle: null,
  thumbnail: null,
  name: null,
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
      const existingNote = state.userNotes.find(
        userNote => userNote.id === action.payload,
      );
      if (existingNote) {
        state.userNotes = state.userNotes.filter(
          userNote => userNote.id !== action.payload,
        );
      }
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
      state.userNotes = [...action.payload.items, ...state.userNotes];

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
      if (state.selectedNote && action.payload.note) {
        state.selectedNote = {
          ...state.selectedNote,
          ...action.payload.note,
          isFromInspiration: action.payload.isFromInspiration,
        };
      } else {
        state.selectedNote = action.payload.note;
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
    setInspirationFilters: (state, action: PayloadAction<Filter[]>) => {
      state.inspirationFilters = action.payload;
    },
    setLoadingNotesGenerate: (state, action: PayloadAction<boolean>) => {
      state.loadingNotesGenerate = action.payload;
    },
    setErrorGenerateNotes: (
      state,
      action: PayloadAction<{ message: string | null; hideAfter: number }>,
    ) => {
      state.errorGenerateNotes = action.payload.message;
      setTimeout(() => {
        state.errorGenerateNotes = null;
      }, action.payload.hideAfter);
    },
    setLoadingFetchingByline: (state, action: PayloadAction<boolean>) => {
      state.loadingFetchingByline = action.payload;
    },
    setHandle: (state, action: PayloadAction<string | null>) => {
      state.handle = action.payload;
    },
    setThumbnail: (state, action: PayloadAction<string | null>) => {
      state.thumbnail = action.payload;
    },
    setName: (state, action: PayloadAction<string | null>) => {
      state.name = action.payload;
    },
    addAttachmentToNote: (
      state,
      action: PayloadAction<{ noteId: string; attachment: NoteDraftImage }>,
    ) => {
      const { noteId, attachment } = action.payload;
      const note = state.userNotes.find(note => note.id === noteId);
      if (note) {
        note.attachments = note.attachments
          ? [...note.attachments, attachment]
          : [attachment];
      }
      state.userNotes = state.userNotes.map(note =>
        note.id === noteId ? { ...note, attachments: note.attachments } : note,
      );
      if (noteId === state.selectedNote?.id) {
        state.selectedNote = {
          ...state.selectedNote,
          attachments: note?.attachments,
        };
      }
    },
    removeAttachmentFromNote: (
      state,
      action: PayloadAction<{ noteId: string; attachmentId: string }>,
    ) => {
      const { noteId, attachmentId } = action.payload;
      const note = state.userNotes.find(note => note.id === noteId);
      if (note) {
        note.attachments = note.attachments?.filter(
          attachment => attachment.id !== attachmentId,
        );
      }
      state.userNotes = state.userNotes.map(note =>
        note.id === noteId ? { ...note, attachments: note.attachments } : note,
      );
      if (noteId === state.selectedNote?.id) {
        state.selectedNote = {
          ...state.selectedNote,
          attachments: note?.attachments,
        };
      }
    },
    setUserSchedule: (state, action: PayloadAction<UserSchedule[]>) => {
      state.userSchedules = action.payload;
    },
    addUserSchedule: (state, action: PayloadAction<UserSchedule>) => {
      state.userSchedules.push(action.payload);
    },
    removeUserSchedule: (state, action: PayloadAction<string>) => {
      state.userSchedules = state.userSchedules.filter(
        schedule => schedule.id !== action.payload,
      );
    },
    updateUserSchedule: (state, action: PayloadAction<UserSchedule>) => {
      state.userSchedules = state.userSchedules.map(schedule =>
        schedule.id === action.payload.id ? action.payload : schedule,
      );
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
  setInspirationFilters,
  setLoadingNotesGenerate,
  setErrorGenerateNotes,
  setLoadingFetchingByline,
  setHandle,
  setThumbnail,
  setName,
  addAttachmentToNote,
  removeAttachmentFromNote,
  setUserSchedule,
  addUserSchedule,
  removeUserSchedule,
  updateUserSchedule,
} = notesSlice.actions;

export const selectNotes = (state: RootState) => state.notes;

export default notesSlice.reducer;
