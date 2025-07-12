// lib/features/real-time/realTimeSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { RealTimeConnectionState } from "@/types/real-time.type";

export interface RealTimeState {
  connectionState: RealTimeConnectionState;
  roomsConnected: Record<string, RealTimeConnectionState>;
  isInitializing: boolean;
  connectionStartTime: number | null;
  lastError: string | null;
}

export const initialState: RealTimeState = {
  connectionState: "disconnected",
  roomsConnected: {},
  isInitializing: false,
  connectionStartTime: null,
  lastError: null,
};

const realTimeSlice = createSlice({
  name: "realTime",
  initialState,
  reducers: {
    setConnectionState: (
      state,
      action: PayloadAction<RealTimeConnectionState>,
    ) => {
      state.connectionState = action.payload;
      if (action.payload === "connected" && !state.connectionStartTime) {
        state.connectionStartTime = Date.now();
      }
      if (action.payload === "disconnected") {
        state.connectionStartTime = null;
      }
    },
    setRoomsConnected: (
      state,
      action: PayloadAction<Record<string, RealTimeConnectionState>>,
    ) => {
      state.roomsConnected = action.payload;
    },
    updateRoomConnection: (
      state,
      action: PayloadAction<{
        roomId: string;
        status: RealTimeConnectionState;
      }>,
    ) => {
      state.roomsConnected[action.payload.roomId] = action.payload.status;
    },
    removeRoomConnection: (state, action: PayloadAction<string>) => {
      delete state.roomsConnected[action.payload];
    },
    setIsInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
    setLastError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload;
    },
    resetRealTimeState: state => {
      state.connectionState = "disconnected";
      state.roomsConnected = {};
      state.isInitializing = false;
      state.connectionStartTime = null;
      state.lastError = null;
    },
  },
});

export const {
  setConnectionState,
  setRoomsConnected,
  updateRoomConnection,
  removeRoomConnection,
  setIsInitializing,
  setLastError,
  resetRealTimeState,
} = realTimeSlice.actions;

export const selectRealTime = (state: RootState): RealTimeState =>
  state.realTime;

export const selectConnectionHealth = (state: RootState) => ({
  connected: state.realTime.connectionState === "connected",
  rooms: Object.keys(state.realTime.roomsConnected).length,
  uptime: state.realTime.connectionStartTime
    ? Date.now() - state.realTime.connectionStartTime
    : 0,
});

export const selectRoomStatus = (roomId: string) => (state: RootState) =>
  state.realTime.roomsConnected[roomId] || "disconnected";

export default realTimeSlice.reducer;
