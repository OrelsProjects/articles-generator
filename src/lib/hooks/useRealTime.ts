import { useCallback, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  selectRealTime,
  selectConnectionHealth,
  selectRoomStatus,
  setConnectionState,
  updateRoomConnection,
  removeRoomConnection,
  setIsInitializing,
  setLastError,
  resetRealTimeState,
} from "@/lib/features/real-time/realTimeSlice";
import { realTimeService } from "@/lib/services/realtime.service";

export function useRealTime() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);
  const realTimeState = useAppSelector(selectRealTime);
  const connectionHealth = useAppSelector(selectConnectionHealth);
  const callbacksSet = useRef(false);

  const isInitializingRef = useRef(false);

  // Set up service callbacks once
  useEffect(() => {
    if (!callbacksSet.current) {
      realTimeService.setCallbacks({
        onConnectionStateChange: state => {
          dispatch(setConnectionState(state as any));
        },
        onRoomStateChange: (roomId, state) => {
          dispatch(updateRoomConnection({ roomId, status: state as any }));
        },
        onInitializingChange: isInitializing => {
          dispatch(setIsInitializing(isInitializing));
        },
        onError: error => {
          dispatch(setLastError(error));
        },
      });
      callbacksSet.current = true;
    }
  }, []);

  const initialize = useCallback(() => {
    // if userid and the state is not connected, initialize
    // If state is loading, don't initialize
    if (realTimeState.connectionState === "connecting") {
      console.log("[ABLY] Already connecting, skipping initialize");
      return;
    }
    if (user?.userId && realTimeState.connectionState !== "connected") {
      if (!isInitializingRef.current) {
        console.log("[ABLY] Initializing");
        isInitializingRef.current = true;
        realTimeService.initialize(user.userId, "useRealTime");
        isInitializingRef.current = false;
      }
    } else {
      console.log("[ABLY] Already connected, skipping initialize");
    }
  }, [user?.userId, realTimeState.connectionState]);

  const connectToRoom = useCallback((clientId: string) => {
    return realTimeService.connectToRoom(clientId);
  }, []);

  const disconnectFromRoom = useCallback((clientId: string) => {
    const success = realTimeService.disconnectFromRoom(clientId);
    if (success) {
      dispatch(removeRoomConnection(clientId));
    }
    return success;
  }, []);

  const sendMessage = useCallback(
    (
      clientId: string,
      data: any,
      options: { subscribeIfNotConnected?: boolean } = {},
    ) => {
      return realTimeService.sendMessage(clientId, data, options);
    },
    [],
  );

  const subscribeToRoom = useCallback(
    (clientId: string, callback: (message: any) => void) => {
      return realTimeService.subscribeToRoom(clientId, callback);
    },
    [],
  );

  const isClientReady = useCallback(() => {
    return realTimeService.isClientReady();
  }, []);

  const getAllChannels = useCallback(() => {
    return realTimeService.getAllChannels();
  }, []);

  return {
    ...realTimeState,
    connectionHealth,
    connectToRoom,
    disconnectFromRoom,
    sendMessage,
    subscribeToRoom,
    initialize,
    isClientReady,
    getAllChannels,
  };
}
