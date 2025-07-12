"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserPlus, Copy, Users, Wifi, WifiOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGhostwriter } from "@/lib/hooks/useGhostwriter";
import { useGhostwriterNotes } from "@/lib/hooks/useGhostwriterNotes";
import { toast } from "react-toastify";
import NotesTabs from "@/components/notes/notes-tabs";
import { useUi } from "@/lib/hooks/useUi";
import {
  buildActiveDays,
  buildGroupedNotes,
  buildGroupedSchedules,
} from "@/lib/utils/collaboration";
import { ActionBar } from "@/components/notes/action-bar";
import { ClientImage } from "@/components/collaboration/client-image";
import { useRealTime } from "@/lib/hooks/useRealTime";

export default function CollaborationPage() {
  const { profile, profileLoading, accessLoading, fetchAll, fetchClientNotes } =
    useGhostwriter();
  const {
    selectClient,
    selectedClientId,
    scheduledNotes,
    draftNotes,
    publishedNotes,
    counters,
    activeClientList,
    clientNotesLoading,
    selectNote,
    createDraftNote,
    loadingCreateNote,
    clientSchedules,
    clientSchedulesLoading,
    fetchClientSchedules,
    selectLastClient,
  } = useGhostwriterNotes();
  const { updateShowCreateScheduleDialog, updateShowGenerateNotesDialog } =
    useUi();
  const {
    connectionState,
    connectToRoom,
    disconnectFromRoom,
    roomsConnected,
    sendMessage,
  } = useRealTime();

  // Get room connection status for the selected client
  const roomStatus = selectedClientId ? roomsConnected[selectedClientId] : null;
  const isSubscribed = roomStatus === "connected";

  // Connection status indicator helper
  const getConnectionStatus = () => {
    switch (connectionState) {
      case "connected":
        return {
          icon: Wifi,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          tooltip: "Real-time connection active - changes will sync instantly",
          canRetry: false,
        };
      case "connecting":
        return {
          icon: Loader2,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          tooltip: "Connecting to real-time service...",
          animate: true,
          canRetry: false,
        };
      case "disconnected":
      case "suspended":
      case "closed":
      case "failed":
        return {
          icon: WifiOff,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          tooltip:
            "Real-time connection offline - changes may not sync immediately (Press to retry)",
          canRetry: true,
        };
      default:
        return {
          icon: WifiOff,
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
          tooltip: "Real-time connection initializing...",
          canRetry: false,
        };
    }
  };

  const connectionStatus = getConnectionStatus();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [highlightDropdown, setHighlightDropdown] = useState(false);
  const [didCreateNote, setDidCreateNote] = useState(false);
  const [didFetchData, setDidFetchData] = useState(false);

  // Compute calendar data using utility functions
  const activeDays = useMemo(
    () => buildActiveDays(scheduledNotes),
    [scheduledNotes],
  );
  const groupedNotes = useMemo(
    () => buildGroupedNotes(scheduledNotes),
    [scheduledNotes],
  );
  const groupedSchedules = useMemo(
    () => buildGroupedSchedules(clientSchedules, activeDays),
    [clientSchedules, activeDays],
  );

  // Create refs for scroll functionality
  const lastNoteRef = useRef<HTMLDivElement>(null);

  // Get latest note for scrolling
  const latestNote = useMemo(() => {
    if (scheduledNotes.length === 0) return null;
    if (scheduledNotes.length === 1) return scheduledNotes[0];
    return [...scheduledNotes].sort(
      (a, b) =>
        new Date(b.scheduledTo || 0).getTime() -
        new Date(a.scheduledTo || 0).getTime(),
    )[0];
  }, [scheduledNotes]);

  const latestNoteId = latestNote?.id;

  // Scroll to latest note function
  const scrollToLatestNote = () => {
    if (activeTab !== "scheduled") {
      setActiveTab("scheduled");
      // Allow time for tab content to render before scrolling
      setTimeout(() => {
        lastNoteRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } else {
      lastNoteRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  useEffect(() => {
    if (!profile) {
      fetchAll();
    }
    if (selectedClientId && !clientNotesLoading && !didFetchData) {
      fetchClientNotes(selectedClientId);
      fetchClientSchedules(selectedClientId);
      setDidFetchData(true);
    }
  }, [
    fetchAll,
    profile,
    selectedClientId,
    clientNotesLoading,
    fetchClientNotes,
    fetchClientSchedules,
    didFetchData,
  ]);

  // Set default selected client when client list loads
  useEffect(() => {
    if (activeClientList && activeClientList.length > 0 && !selectedClientId) {
      selectLastClient();
    }
  }, [activeClientList, selectedClientId, selectClient, selectLastClient]);

  // Connect to real-time room when client is selected
  useEffect(() => {
    if (selectedClientId && connectionState === "connected") {
      connectToRoom(selectedClientId);
    }

    return () => {
      if (selectedClientId) {
        disconnectFromRoom(selectedClientId);
      }
    };
  }, [selectedClientId, connectionState, connectToRoom, disconnectFromRoom]);

  const handleCopyToken = async () => {
    if (profile?.token) {
      await navigator.clipboard.writeText(profile.token);
      toast.success("Token copied to clipboard");
    }
  };

  const selectedClientData = useMemo(
    () =>
      activeClientList?.find(
        client => client.accountUserId === selectedClientId,
      ),
    [activeClientList, selectedClientId],
  );

  // Function to send updates to client
  const notifyClient = useCallback(
    async (messageType: string, data: any) => {
      if (!selectedClientId || connectionState !== "connected") {
        console.error(
          "Cannot send message: no client selected or not connected",
        );
        return false;
      }

      return await sendMessage(selectedClientId, {
        type: messageType,
        data: {
          ...data,
          ghostwriterId: profile?.id,
          ghostwriterName: profile?.name,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [selectedClientId, connectionState, sendMessage, profile],
  );

  // Handle retry connection
  const handleRetryConnection = () => {
    if (selectedClientId && connectionState !== "connected") {
      connectToRoom(selectedClientId);
      toast.info("Attempting to reconnect to real-time service...");
    }
  };

  // Loading state
  if (profileLoading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading collaboration settings...
          </p>
        </div>
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="feature-layout-container mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Create Your Ghostwriter Profile</CardTitle>
            <CardDescription>
              To start collaborating with ghostwriters, you need to create a
              profile first. This allows other writers to generate content on
              your behalf while maintaining your unique voice and style.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg">
              <Link href="/settings?createProfile=true#ghostwriter">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Ghostwriter Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has profile but no access list
  if (!activeClientList || activeClientList.length === 0) {
    return (
      <div className="feature-layout-container mx-auto flex items-center justify-center">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Copy className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Share Your Token</CardTitle>
            <CardDescription>
              Your ghostwriter profile is ready! Now you need to share your
              access token with the author so you can generate content on their
              behalf.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="w-full flex flex-col items-center justify-center">
                  <p className="font-medium">Your Access Token</p>
                  <p className="text-sm text-muted-foreground font-mono bg-background p-2 rounded mt-2 break-all">
                    {profile.token}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCopyToken}
              variant="outline"
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Token
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Share this token with the author. They can use it to add you to
              their collaboration list.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has profile and access list
  return (
    <TooltipProvider>
      <div className="feature-layout-container space-y-6 pt-16">
        {/* Header with ghostwriter selection */}
        <Card className="border-yellow-500/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">
                    Active Collaboration
                  </CardTitle>
                  <Tooltip delayDuration={50}>
                    <TooltipTrigger asChild>
                      <div
                        className={`p-2 rounded-full ${connectionStatus.bgColor} ${connectionStatus.canRetry ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
                        onClick={() => {
                          if (connectionStatus.canRetry) {
                            handleRetryConnection();
                          }
                        }}
                      >
                        <connectionStatus.icon
                          className={`w-4 h-4 ${connectionStatus.color} ${connectionStatus.animate ? "animate-spin" : ""}`}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{connectionStatus.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                  {/* Room connection status */}
                  {selectedClientId && roomStatus && (
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <div
                          className={`px-2 py-1 rounded text-xs ${
                            roomStatus === "connected"
                              ? "bg-green-500/10 text-green-500"
                              : roomStatus === "connecting"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {roomStatus === "connected"
                            ? "Room Connected"
                            : roomStatus === "connecting"
                              ? "Connecting..."
                              : "Room Disconnected"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {roomStatus === "connected"
                            ? "You can send updates to the client"
                            : roomStatus === "connecting"
                              ? "Establishing connection to client room..."
                              : "Not connected to client room"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <CardDescription>
                  You are writing on behalf of{" "}
                  {selectedClientData?.accountUserName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Select
                value={selectedClientId || ""}
                onValueChange={selectClient}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a ghostwriter" />
                </SelectTrigger>
                <SelectContent>
                  {activeClientList.map(client => {
                    return (
                      <SelectItem key={client.id} value={client.accountUserId}>
                        <div className="h-full flex items-center space-x-2">
                          <ClientImage
                            image={client.accountUserImage || undefined}
                            name={client.accountUserName || ""}
                          />
                          <span>{client.accountUserName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <ActionBar clientId={selectedClientId} />
            </div>
          </CardContent>
        </Card>

        {/* Real-time Debug Section - Remove in production */}
        {process.env.NODE_ENV === "development" &&
          connectionState === "connected" && (
            <Card className="border-blue-500/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Real-time Debug</CardTitle>
                  <div
                    className={`w-2 h-2 rounded-full ${isSubscribed ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isSubscribed ? "Subscribed to room" : "Not subscribed"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Connection State: {connectionState}
                  </p>
                  {selectedClientId && roomStatus && (
                    <p className="text-xs text-muted-foreground">
                      Room Status: {roomStatus}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Main content area - Notes tabs */}
        {selectedClientId ? (
          <div className="space-y-6">
            <NotesTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counters={counters}
              scheduledNotes={scheduledNotes}
              draftNotes={draftNotes}
              publishedNotes={publishedNotes}
              activeDays={activeDays}
              groupedNotes={groupedNotes}
              groupedSchedules={groupedSchedules}
              lastNoteRef={lastNoteRef}
              lastNoteId={latestNoteId}
              loadingFetchingSchedules={
                clientNotesLoading || clientSchedulesLoading
              }
              loadingCreateNote={loadingCreateNote}
              onSelectNote={selectNote}
              onEditQueue={() =>
                updateShowCreateScheduleDialog(true, selectedClientId)
              }
              onCreateNote={async () => {
                await createDraftNote();
              }}
              onGenerateNotes={() =>
                updateShowGenerateNotesDialog(true, selectedClientId)
              }
              hasNewNotes={false}
              didCreateNote={didCreateNote}
              highlightDropdown={highlightDropdown}
              setHighlightDropdown={setHighlightDropdown}
              scrollToLatestNote={scrollToLatestNote}
              isGhostwriter={true}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <p>Select a client to view and manage their notes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
