import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import {
  GhostwriterAccess,
  GhostwriterProfile,
  GhostwriterClient,
} from "@/types/ghost-writer";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";

export interface GhostwriterState {
  // User's own ghostwriter profile
  profile: GhostwriterProfile | null;
  profileLoading: boolean;
  profileError: string | null;

  // Ghostwriters who have access to user's account
  accessList: GhostwriterAccess[];
  accessLoading: boolean;
  accessError: string | null;

  // Clients the user is ghostwriting for
  clientList: GhostwriterClient[];
  clientLoading: boolean;
  clientError: string | null;

  // Client notes (notes created for specific clients)
  clientNotes: Record<string, NoteDraft[]>; // clientId -> notes
  selectedClientId: string | null;
  clientNotesLoading: boolean;
  clientNotesError: string | null;
  selectedClientNote: NoteDraft | null;

  // Client schedules (schedules created for specific clients)
  clientSchedules: UserSchedule[];
  clientSchedulesLoading: boolean;
  clientSchedulesError: string | null;

  // UI state
  showCreateProfileDialog: boolean;
  showAddAccessDialog: boolean;
  showEditAccessDialog: boolean;
  editingAccess: GhostwriterAccess   | null;
}

const initialState: GhostwriterState = {
  profile: null,
  profileLoading: false,
  profileError: null,

  accessList: [],
  accessLoading: false,
  accessError: null,

  clientList: [],
  clientLoading: false,
  clientError: null,

  clientNotes: {},
  selectedClientId: null,
  clientNotesLoading: false,
  clientNotesError: null,
  selectedClientNote: null,

  clientSchedules: [],
  clientSchedulesLoading: false,
  clientSchedulesError: null,

  showCreateProfileDialog: false,
  showAddAccessDialog: false,
  showEditAccessDialog: false,
  editingAccess: null,
};

const ghostwriterSlice = createSlice({
  name: "ghostwriter",
  initialState,
  reducers: {
    // Profile actions
    setProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.profileLoading = action.payload;
    },
    setProfileError: (state, action: PayloadAction<string | null>) => {
      state.profileError = action.payload;
    },
    setProfile: (state, action: PayloadAction<GhostwriterProfile | null>) => {
      state.profile = action.payload;
      state.profileLoading = false;
      state.profileError = null;
    },

    // Access list actions
    setAccessLoading: (state, action: PayloadAction<boolean>) => {
      state.accessLoading = action.payload;
    },
    setAccessError: (state, action: PayloadAction<string | null>) => {
      state.accessError = action.payload;
    },
    setAccessList: (state, action: PayloadAction<GhostwriterAccess[]>) => {
      state.accessList = action.payload;
      state.accessLoading = false;
      state.accessError = null;
    },
    addAccess: (state, action: PayloadAction<GhostwriterAccess>) => {
      state.accessList.push(action.payload);
    },
  updateAccess: (state, action: PayloadAction<GhostwriterAccess>) => {
      const index = state.accessList.findIndex(
        access => access.id === action.payload.id,
      );
      if (index !== -1) {
        state.accessList[index] = action.payload;
      }
    },
    removeAccess: (state, action: PayloadAction<string>) => {
      state.accessList = state.accessList.filter(
        access => access.id !== action.payload,
      );
    },

    // Client list actions
    setClientLoading: (state, action: PayloadAction<boolean>) => {
      state.clientLoading = action.payload;
    },
    setClientError: (state, action: PayloadAction<string | null>) => {
      state.clientError = action.payload;
    },
    setClientList: (state, action: PayloadAction<GhostwriterClient[]>) => {
      state.clientList = action.payload;
      state.clientLoading = false;
      state.clientError = null;
    },
    updateClient: (state, action: PayloadAction<Partial<GhostwriterClient>>) => {
      const index = state.clientList.findIndex(
        client => client.id === action.payload.id,
      );
      if (index !== -1) {
        state.clientList[index] = {
          ...state.clientList[index],
          ...action.payload,
        };
      }
    },

    // Client notes actions
    setSelectedClientId: (state, action: PayloadAction<string | null>) => {
      state.selectedClientId = action.payload;
    },
    setClientNotesLoading: (state, action: PayloadAction<boolean>) => {
      state.clientNotesLoading = action.payload;
    },
    setClientNotesError: (state, action: PayloadAction<string | null>) => {
      state.clientNotesError = action.payload;
    },
    setClientNotes: (
      state,
      action: PayloadAction<{ clientId: string; notes: NoteDraft[] }>,
    ) => {
      state.clientNotes[action.payload.clientId] = action.payload.notes;
      state.clientNotesLoading = false;
      state.clientNotesError = null;
    },
    addClientNote: (
      state,
      action: PayloadAction<{ clientId: string; note: NoteDraft }>,
    ) => {
      if (!state.clientNotes[action.payload.clientId]) {
        state.clientNotes[action.payload.clientId] = [];
      }
      state.clientNotes[action.payload.clientId].unshift(action.payload.note);
    },
    addClientNotes: (
      state,
      action: PayloadAction<{ clientId: string; notes: NoteDraft[] }>,
    ) => {
      if (!state.clientNotes[action.payload.clientId]) {
        state.clientNotes[action.payload.clientId] = [];
      }
      state.clientNotes[action.payload.clientId].push(...action.payload.notes);
    },

    updateClientNote: (
      state,
      action: PayloadAction<{
        clientId: string;
        noteId: string;
        note: Partial<NoteDraft>;
      }>,
    ) => {
      const { clientId, noteId, note } = action.payload;
      if (state.clientNotes[clientId]) {
        const index = state.clientNotes[clientId].findIndex(
          n => n.id === noteId,
        );
        if (index !== -1) {
          state.clientNotes[clientId][index] = {
            ...state.clientNotes[clientId][index],
            ...note,
          };
        }
      }
    },
    removeClientNote: (
      state,
      action: PayloadAction<{ clientId: string; noteId: string }>,
    ) => {
      const { clientId, noteId } = action.payload;
      if (state.clientNotes[clientId]) {
        state.clientNotes[clientId] = state.clientNotes[clientId].filter(
          note => note.id !== noteId,
        );
      }
    },
    setSelectedClientNote: (state, action: PayloadAction<NoteDraft | null>) => {
      state.selectedClientNote = action.payload;
    },

    // Client schedules actions
    setClientSchedulesLoading: (state, action: PayloadAction<boolean>) => {
      state.clientSchedulesLoading = action.payload;
    },
    setClientSchedulesError: (state, action: PayloadAction<string | null>) => {
      state.clientSchedulesError = action.payload;
    },
    setClientSchedules: (
      state,
      action: PayloadAction<{ clientId: string; schedules: UserSchedule[] }>,
    ) => {
      state.clientSchedules = action.payload.schedules;
      state.clientSchedulesLoading = false;
      state.clientSchedulesError = null;
    },

    // UI actions
    setShowCreateProfileDialog: (state, action: PayloadAction<boolean>) => {
      state.showCreateProfileDialog = action.payload;
    },
    setShowAddAccessDialog: (state, action: PayloadAction<boolean>) => {
      state.showAddAccessDialog = action.payload;
    },
    setShowEditAccessDialog: (state, action: PayloadAction<boolean>) => {
      state.showEditAccessDialog = action.payload;
      if (!action.payload) {
        state.editingAccess = null;
      }
    },
    setEditingAccess: (
      state,
      action: PayloadAction<GhostwriterAccess | null>,
    ) => {
      state.editingAccess = action.payload;
      state.showEditAccessDialog = !!action.payload;
    },

    // Reset actions
    resetGhostwriterState: () => initialState,
  },
});

export const {
  setProfileLoading,
  setProfileError,
  setProfile,
  setAccessLoading,
  setAccessError,
  setAccessList,
  addAccess,
  updateAccess,
  removeAccess,
  setClientLoading,
  setClientError,
  setClientList,
  updateClient,
  setSelectedClientId,
  setClientNotesLoading,
  setClientNotesError,
  setClientNotes,
  addClientNote,
  addClientNotes,
  updateClientNote,
  removeClientNote,
  setSelectedClientNote,
  setClientSchedulesLoading,
  setClientSchedulesError,
  setClientSchedules,
  setShowCreateProfileDialog,
  setShowAddAccessDialog,
  setShowEditAccessDialog,
  setEditingAccess,
  resetGhostwriterState,
} = ghostwriterSlice.actions;

export const selectGhostwriter = (state: RootState): GhostwriterState =>
  state.ghostwriter;

export default ghostwriterSlice.reducer;
