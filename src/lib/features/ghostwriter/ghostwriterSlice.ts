import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { MyGhostwriter, GhostwriterProfile, GhostwriterAccess, GhostwriterClient } from "@/types/ghost-writer";

export interface GhostwriterState {
  // User's own ghostwriter profile
  profile: GhostwriterProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  
  // Ghostwriters who have access to user's account
  accessList: MyGhostwriter[];
  accessLoading: boolean;
  accessError: string | null;
  
  // Clients the user is ghostwriting for
  clientList: GhostwriterClient[];
  clientLoading: boolean;
  clientError: string | null;
  
  // UI state
  showCreateProfileDialog: boolean;
  showAddAccessDialog: boolean;
  showEditAccessDialog: boolean;
  editingAccess: MyGhostwriter | null;
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
    setAccessList: (state, action: PayloadAction<MyGhostwriter[]>) => {
      state.accessList = action.payload;
      state.accessLoading = false;
      state.accessError = null;
    },
    addAccess: (state, action: PayloadAction<MyGhostwriter>) => {
      state.accessList.push(action.payload);
    },
    updateAccess: (state, action: PayloadAction<MyGhostwriter>) => {
      const index = state.accessList.findIndex(
        access => access.id === action.payload.id
      );
      if (index !== -1) {
        state.accessList[index] = action.payload;
      }
    },
    removeAccess: (state, action: PayloadAction<string>) => {
      state.accessList = state.accessList.filter(
        access => access.id !== action.payload
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
    updateClient: (state, action: PayloadAction<GhostwriterClient>) => {
      const index = state.clientList.findIndex(
        client => client.id === action.payload.id
      );
      if (index !== -1) {
        state.clientList[index] = action.payload;
      }
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
    setEditingAccess: (state, action: PayloadAction<MyGhostwriter | null>) => {
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
  setShowCreateProfileDialog,
  setShowAddAccessDialog,
  setShowEditAccessDialog,
  setEditingAccess,
  resetGhostwriterState,
} = ghostwriterSlice.actions;

export const selectGhostwriter = (state: RootState): GhostwriterState => state.ghostwriter;

export default ghostwriterSlice.reducer; 