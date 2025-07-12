import { useAppSelector } from "@/lib/hooks/redux";
import { selectRoomStatus } from "@/lib/features/real-time/realTimeSlice";
import { useRealTime } from "@/lib/hooks/useRealTime";
import { useCallback, useEffect } from "react";

export function useRealTimeRoom(clientId: string) {
  const { connectToRoom, sendMessage } = useRealTime();
  const roomStatus = useAppSelector(selectRoomStatus(clientId));

  useEffect(() => {
    connectToRoom(clientId);
  }, [clientId, connectToRoom]);

  return {
    isConnected: roomStatus === "connected",
    isConnecting: roomStatus === "connecting",
    status: roomStatus,
    sendMessage: useCallback(
      (data: any) => sendMessage(clientId, data),
      [clientId, sendMessage],
    ),
  };
}

export function useRealTimeMessage(
  clientId: string,
  onMessage: (message: any) => void,
) {
  const { subscribeToRoom } = useRealTime();

  useEffect(() => {
    const unsubscribe = subscribeToRoom(clientId, onMessage);
    return unsubscribe;
  }, [clientId, onMessage, subscribeToRoom]);
}
