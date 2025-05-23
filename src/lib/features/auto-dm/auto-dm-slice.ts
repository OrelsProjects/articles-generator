import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { AutoDM } from "@/types/auto-dm";

export interface AutoDMState {
  autoDMs: AutoDM[];
}

export const initialState: AutoDMState = {
  autoDMs: [],
};

const autoDMSlice = createSlice({
  name: "autoDM",
  initialState,
  reducers: {
    setAutoDMs: (state, action: PayloadAction<AutoDM[]>) => {
      state.autoDMs = action.payload;
    },
    updateAutoDM: (state, action: PayloadAction<AutoDM>) => {
      const index = state.autoDMs.findIndex(
        autoDM => autoDM.id === action.payload.id,
      );
      if (index !== -1) {
        state.autoDMs[index] = action.payload;
      }
    },
    addAutoDM: (state, action: PayloadAction<AutoDM>) => {
      state.autoDMs.push(action.payload);
    },
    deleteAutoDM: (state, action: PayloadAction<string>) => {
      state.autoDMs = state.autoDMs.filter(
        autoDM => autoDM.id !== action.payload,
      );
    },
  },
});

export const { setAutoDMs, updateAutoDM, addAutoDM, deleteAutoDM } =
  autoDMSlice.actions;

export const selectAutoDM = (state: RootState): AutoDMState => state.autoDM;

export default autoDMSlice.reducer;
