"use client";

import { selectAuth } from "@/lib/features/auth/authSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import { useGhostwriter } from "@/lib/hooks/useGhostwriter";
import { useNotes } from "@/lib/hooks/useNotes";
import { useRealTime } from "@/lib/hooks/useRealTime";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export default function GhostwriteClientProvider() {
  const { user } = useAppSelector(selectAuth);
  const { accessList, fetchAccessList, fetchClientNotes } = useGhostwriter();
  const {
    roomsConnected,
    subscribeToRoom,
    connectToRoom,
    disconnectFromRoom,
    connectionState,
    isInitializing,
    initialize,
    isClientReady,
    getAllChannels,
  } = useRealTime();

  const { fetchNotes, deleteNoteLocally, scheduleNoteLocally } = useNotes();

  const [clientReady, setClientReady] = useState(false);

  const isConnectingToRoomRef = useRef(false);

  useEffect(() => {
    initialize();
  }, []);

  // Fetch access list on mount
  useEffect(() => {
    fetchAccessList();
  }, []);

  // Connect to room when conditions are met
  useEffect(() => {
    if (!user?.userId || accessList.length === 0) {
      return;
    }

    // Wait for service to be fully initialized and connected
    if (
      connectionState !== "connected" ||
      isInitializing ||
      isConnectingToRoomRef.current
    ) {
      return;
    }

    const roomId = user.userId;
    const roomStatus = roomsConnected[roomId];

    // Double-check that the client is truly ready
    if (!clientReady) {
      console.log("[GHOSTWRITE CLIENT] Client not ready yet, waiting...");
      return;
    }

    // Only connect if not already connected or connecting
    if (roomStatus !== "connected" && roomStatus !== "connecting") {
      isConnectingToRoomRef.current = true;

      const success = connectToRoom(roomId);

      if (success) {
        console.log(
          "[GHOSTWRITE CLIENT] Successfully connected to room:",
          roomId,
        );
        console.log(
          "[GHOSTWRITE CLIENT] All channels:",
          getAllChannels().map(channel => channel.name),
        );
        subscribeToRoom(roomId, message => {
          console.log("[GHOSTWRITE CLIENT] Received message:", message);

          // Extract data from the message
          const messageData = message.data.data || message;

          const type = messageData.type;
          console.log(
            "[GHOSTWRITE CLIENT] Message data:",
            messageData,
            "Type: ",
            type,
          );

          debugger;
          // Handle different message types
          switch (type) {
            case "note_created":
              // Refresh notes
              fetchNotes();
              break;

            case "note_updated":
              if (user.userId) {
                fetchClientNotes(user.userId);
              }
              break;

            case "note_deleted":
              deleteNoteLocally(messageData.noteId);
              break;

            case "note_scheduled":
              const noteId = messageData.noteId;
              const scheduledTo = messageData.scheduledTo;
              scheduleNoteLocally(noteId, new Date(scheduledTo));
              break;

            default:
              console.log(
                "[GHOSTWRITE CLIENT] Unknown message type:",
                messageData.type,
              );
          }
        });
      } else {
        console.error("[GHOSTWRITE CLIENT] Failed to connect to room:", roomId);
      }

      isConnectingToRoomRef.current = false;
    }

    // Cleanup: disconnect when component unmounts
    return () => {
      if (roomsConnected[roomId] === "connected") {
        console.log("[GHOSTWRITE CLIENT] Disconnecting from room:", roomId);
        disconnectFromRoom(roomId);
      }
    };
  }, [connectionState, accessList, clientReady]);

  // Subscribe to messages after room is connected
  //   useEffect(() => {
  //     if (!user?.userId || accessList.length === 0) {
  //       return;
  //     }

  //     const roomId = user.userId;
  //     const roomStatus = roomsConnected[roomId];

  //     // Only subscribe if room is connected
  //     if (roomStatus !== "connected") {
  //       console.log(
  //         `[GHOSTWRITE CLIENT] Room ${roomId} not connected yet, status: ${roomStatus}`,
  //       );
  //       return;
  //     }

  //     console.log("[GHOSTWRITE CLIENT] Subscribing to messages in room:", roomId);

  //     const unsubscribe = subscribeToRoom(roomId, message => {
  //       console.log("[GHOSTWRITE CLIENT] Received message:", message);

  //       // Extract data from the message
  //       const messageData = message.data.data || message;

  //       // Find the ghostwriter's name from access list
  //       const ghostwriter = accessList.find(
  //         g => g.ghostwriter.id === messageData.data?.ghostwriter?.id,
  //       );
  //       const ghostwriterName =
  //         ghostwriter?.ghostwriter.name ||
  //         messageData.data?.ghostwriterName ||
  //         "A ghostwriter";

  //       const type = messageData.type;
  //       console.log("[GHOSTWRITE CLIENT] Message data:", messageData);

  //       // Handle different message types
  //       switch (type) {
  //         case "note_created":
  //           toast.info(
  //             `${ghostwriterName} created a new note: "${messageData.note.noteTitle}"`,
  //             {
  //               autoClose: 5000,
  //             },
  //           );
  //           // Refresh notes
  //           fetchNotes();
  //           break;

  //         case "note_updated":
  //           toast.info(
  //             `${ghostwriterName} updated a note: "${messageData.note.noteTitle}"`,
  //             {
  //               position: "bottom-right",
  //               autoClose: 5000,
  //             },
  //           );
  //           if (user.userId) {
  //             fetchClientNotes(user.userId);
  //           }
  //           break;

  //         case "note_deleted":
  //           toast.info(`${ghostwriterName} deleted a note`, {
  //             position: "bottom-right",
  //             autoClose: 5000,
  //           });
  //           if (user.userId) {
  //             fetchClientNotes(user.userId);
  //           }
  //           break;

  //         case "schedule_updated":
  //           toast.info(`${ghostwriterName} updated the schedule`, {
  //             position: "bottom-right",
  //             autoClose: 5000,
  //           });
  //           break;

  //         default:
  //           console.log(
  //             "[GHOSTWRITE CLIENT] Unknown message type:",
  //             messageData.type,
  //           );
  //       }
  //     });

  //     // Cleanup: unsubscribe when component unmounts or conditions change
  //     return () => {
  //       console.log("[GHOSTWRITE CLIENT] Unsubscribing from room:", roomId);
  //       unsubscribe();
  //     };
  //   }, [user?.userId, accessList, roomsConnected]);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[GHOSTWRITE CLIENT] Debug state:", {
        userId: user?.userId,
        connectionState,
        isInitializing,
        isClientReady: isClientReady(),
        hasGhostwriters: accessList.length > 0,
        roomsConnected: Object.keys(roomsConnected).map(key => ({
          room: key,
          status: roomsConnected[key],
        })),
        isConnectingToRoom: isConnectingToRoomRef.current,
      });
    }
  }, [
    user?.userId,
    connectionState,
    isInitializing,
    accessList.length,
    roomsConnected,
    isClientReady,
  ]);

  // Check every 3 seconds if the client is ready
  useEffect(() => {
    const interval = setInterval(() => {
      if (isClientReady()) {
        setClientReady(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isClientReady]);

  return null;
}
