"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { useQueue } from "@/lib/hooks/useQueue";
import { useNotes } from "@/lib/hooks/useNotes";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import {
  LayoutGrid,
  List,
  Info,
  Plus,
  RefreshCw,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";
import NoteComponent from "@/components/ui/note-component";
import { ScheduledNotesList } from "@/components/queue/components";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { usePathname, useSearchParams } from "next/navigation";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { CreateNoteButton } from "@/components/notes/create-note-button";
import { useUi } from "@/lib/hooks/useUi";
import { NotesStatusBoard } from "@/components/notes/notes-status-board";
import { resetNotification } from "@/lib/features/notes/notesSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import KanbanLoading from "@/components/loading/kanban-loading";
import { appName } from "@/lib/consts";

const KANBAN_TITLE = "Your notes";
const LIST_TITLE = "Your notes";

// Enhanced Empty State Card Component
const EmptyStateCard = ({
  onAddNote,
  onGenerateNotes,
  loading,
}: {
  onAddNote: () => void;
  onGenerateNotes: () => void;
  loading?: boolean;
}) => (
  <motion.div className="rounded-lg p-6 text-center space-y-4">
    <p className="text-muted-foreground">You don&apos;t have any drafts.</p>
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center">
      <Button
        onClick={onAddNote}
        disabled={loading}
        variant="outline"
        className="flex items-center gap-2"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <StickyNote className="w-4 h-4" />
        )}
        New draft
      </Button>

      <Button
        variant="outline"
        onClick={onGenerateNotes}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Sparkles className={cn("w-4 h-4")} />
        Generate notes
      </Button>
    </div>
  </motion.div>
);

// Segmented Control Component
const ViewToggle = ({
  value,
  onChange,
}: {
  value: "kanban" | "list";
  onChange: (value: "kanban" | "list") => void;
}) => (
  <div className="flex items-center justify-center mb-8">
    <div className="relative flex bg-muted/50 dark:bg-muted/50 p-1 rounded-lg">
      <motion.div
        className="absolute inset-y-1 bg-muted rounded-md shadow-sm"
        initial={false}
        animate={{
          x: value === "list" ? 0 : "100%",
          width: value === "list" ? "50%" : "48.5%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      <Button
        clean
        onClick={() => onChange("list")}
        className={cn(
          "relative z-10 px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
          value === "list"
            ? "text-foreground dark:text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List size={16} />
        Queue
      </Button>
      <Button
        clean
        onClick={() => onChange("kanban")}
        className={cn(
          "relative z-10 px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
          value === "kanban"
            ? "text-foreground dark:text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid size={16} />
        Kanban
      </Button>
    </div>
  </div>
);

// Enhanced Action Bar Component with first-time drafts support
const ActionBar = ({ className }: { className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("z-50 flex flex-col gap-2 sm:flex-row sm:gap-3", className)}
  >
    <CreateNoteButton />
  </motion.div>
);

export default function StatusBoardPage() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // View state management
  const [viewMode, setViewMode] = useLocalStorage<"kanban" | "list">(
    "notes_view_mode",
    "list",
  );

  // Queue page state
  const [activeTabCache, setActiveTabCache] = useLocalStorage(
    "queue_active_tab",
    "scheduled",
  );

  const [didCreateNote, setDidCreateNote] = useLocalStorage(
    "did_create_note",
    false,
  );

  const [activeDays, setActiveDays] = useState<Date[]>([]);
  const [activeTab, setActiveTab] = useState("scheduled");
  const [_, setIsFetchingForUpdate] = useState(false);
  const [highlightDropdown, setHighlightDropdown] = useState(false);

  // Hooks
  const {
    scheduledNotes,
    draftNotes,
    publishedNotes,
    counters,
    nextPage,
    resetPage,
    fetchQueue,
    loadingFetchingSchedules,
  } = useQueue();
  const {
    selectNote,
    fetchNotes,
    userNotes,
    createDraftNote,
    loadingNotes,
    firstLoadingNotes,
    loadingCreateNote,
  } = useNotes();
  const { userSchedules, hasNewNotes } = useAppSelector(state => state.notes);
  const { updateShowCreateScheduleDialog, updateShowGenerateNotesDialog } =
    useUi();

  // Refs
  const lastFetchOnActiveTab = useRef<Date | null>(null);
  const lastNoteRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation
  const router = useCustomRouter();
  const pathname = usePathname();
  const viewFromSearchParams = searchParams.get("view");

  // Set didCreateNote to true if the user has created a note
  useEffect(() => {
    if (draftNotes.length > 0 && !didCreateNote) {
      setDidCreateNote(true);
    }
  }, [draftNotes]);

  useEffect(() => {
    if (viewFromSearchParams) {
      setViewMode(viewFromSearchParams as "kanban" | "list");
      router.push(pathname, {
        paramsToRemove: ["view"],
      });
    }
  }, [viewFromSearchParams]);

  // Initialize
  useEffect(() => {
    dispatch(resetNotification());
    fetchNotes();
    fetchQueue();
  }, []);

  useEffect(() => {
    if (activeTab === "drafts") {
      if (hasNewNotes) {
        dispatch(resetNotification());
      }
    }
  }, [hasNewNotes, activeTab]);

  // Generate an array of dates based on scheduled notes and minimum 28 days
  useEffect(() => {
    const today = startOfToday();
    const days = [];

    // Find the earliest and latest scheduled note dates
    let earliestScheduledDate = today;
    let latestScheduledDate = addDays(today, 28); // Default to 28 days ahead

    scheduledNotes.forEach(note => {
      if (note.scheduledTo) {
        const noteDate = new Date(note.scheduledTo);
        // Check for notes in the past
        if (noteDate < earliestScheduledDate) {
          earliestScheduledDate = noteDate;
        }
        // Check for notes far in the future
        if (noteDate > latestScheduledDate) {
          latestScheduledDate = noteDate;
        }
      }
    });

    // Ensure we show dates from the earliest scheduled note up to the furthest scheduled note
    let currentDay = earliestScheduledDate;

    while (currentDay <= latestScheduledDate) {
      days.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    setActiveDays(days);
  }, [scheduledNotes]);

  useEffect(() => {
    setActiveTab(activeTabCache);
  }, [activeTabCache]);

  // Refetch notes when the page becomes visible/focused again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // If less than 5 minutes have passed since last fetch, don't fetch again
        if (
          lastFetchOnActiveTab.current &&
          Date.now() - lastFetchOnActiveTab.current.getTime() < 5 * 60 * 1000
        ) {
          return;
        }
        lastFetchOnActiveTab.current = new Date();
        setIsFetchingForUpdate(true);
        fetchNotes().finally(() => {
          setIsFetchingForUpdate(false);
        });
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotes]);

  // if scroll is at 60% of the page, fetch more scheduled notes.
  // Make sure it doesn't trigger too many times, due to a fast scroll.
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.scrollHeight * 0.6
      ) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          nextPage();
        }, 100);
      }
    };
    const mainContentScroll = document.getElementById("main-content-scroll");
    if (mainContentScroll) {
      mainContentScroll.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (mainContentScroll) {
        mainContentScroll.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleUpdateActiveTab = (tab: string) => {
    // if queue, fetch notes
    if (tab === "scheduled") {
      setIsFetchingForUpdate(true);
      fetchNotes().finally(() => {
        setIsFetchingForUpdate(false);
      });
    }
    setActiveTab(tab);
    setActiveTabCache(tab);
    resetPage();
  };

  // Find the latest scheduled note for scrolling
  const getLatestNote = () => {
    if (scheduledNotes.length === 0) return null;

    if (scheduledNotes.length === 1) return scheduledNotes[0];

    return [...scheduledNotes].sort(
      (a, b) =>
        new Date(b.scheduledTo || 0).getTime() -
        new Date(a.scheduledTo || 0).getTime(),
    )[0];
  };

  // Scroll to latest note
  const scrollToLatestNote = () => {
    if (activeTab !== "scheduled") {
      handleUpdateActiveTab("scheduled");
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

  // Group notes by date
  const groupedScheduledNotes = () => {
    const grouped: Record<string, NoteDraft[]> = {};

    scheduledNotes.forEach(note => {
      if (note.scheduledTo) {
        const dateKey = format(new Date(note.scheduledTo), "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(note);
      }
    });

    // Sort notes within each group by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        if (a.scheduledTo && b.scheduledTo) {
          return (
            new Date(a.scheduledTo).getTime() -
            new Date(b.scheduledTo).getTime()
          );
        }
        return 0;
      });
    });

    return grouped;
  };

  // Group schedules by date for empty slots
  const groupedSchedules = () => {
    const grouped: Record<string, UserSchedule[]> = {};

    userSchedules.forEach(schedule => {
      // Check each active day and add applicable schedules
      activeDays.forEach(day => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayOfWeek = format(day, "EEEE").toLowerCase();

        // Check if this schedule applies to this day of week
        if (schedule[dayOfWeek as keyof UserSchedule]) {
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(schedule);
        }
      });
    });

    // Sort schedules within each day by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const aHour = a.ampm === "pm" && a.hour !== 12 ? a.hour + 12 : a.hour;
        const bHour = b.ampm === "pm" && b.hour !== 12 ? b.hour + 12 : b.hour;

        if (aHour !== bHour) return aHour - bHour;
        return a.minute - b.minute;
      });
    });

    return grouped;
  };

  // Handle note selection
  const handleSelectNote = (note: NoteDraft) => {
    selectNote(note);
  };

  // Get latest note ID for ref
  const latestNote = getLatestNote();
  const latestNoteId = latestNote?.id;

  // Toggle view mode with animation
  const toggleViewMode = (newMode: "kanban" | "list") => {
    if (newMode !== viewMode) {
      setViewMode(newMode);
    }
  };

  const QueueLoading = () => (
    <div className="w-full mx-auto z-10">
      {/* Banner skeleton */}
      <div className="bg-muted/40 border border-muted p-4 py-5 rounded-lg mb-6 flex items-center">
        <Skeleton className="h-5 w-5 mr-3 rounded-full" />
        <Skeleton className="h-4 w-64 rounded " />
      </div>

      {/* Tab navigation skeleton */}
      <div className="mb-4 border-b border-border">
        <div className="flex space-x-8 overflow-x-auto overflow-y-hidden">
          {["Scheduled", "Drafts", "Published", "All"].map((tab, index) => (
            <div key={tab} className="flex items-center space-x-2 px-6 py-3">
              <Skeleton className="h-4 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col space-y-3 rounded-xl border p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex space-x-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CreateNewNoteInstructions = () => (
    <div className="text-center text-muted-foreground">
      <p className="text-lg mb-2">Your {appName} notes will be here.</p>
      <p className="cursor-default">
        To create a new note, click{" "}
        <span
          className="font-bold"
          onMouseEnter={() => setHighlightDropdown(true)}
          onMouseLeave={() => setHighlightDropdown(false)}
        >
          New draft
        </span>{" "}
        to create an empty note, or{" "}
        <span
          className="font-bold"
          onMouseEnter={() => setHighlightDropdown(true)}
          onMouseLeave={() => setHighlightDropdown(false)}
        >
          Generate notes
        </span>{" "}
        to generate a note from your article.
      </p>
    </div>
  );

  const Loading = () => {
    return viewMode === "kanban" ? <KanbanLoading /> : <QueueLoading />;
  };

  // Main layout wrapper
  return (
    <div className="w-full h-full py-8 flex flex-col items-center">
      <div className="feature-layout-container">
        <ViewToggle value={viewMode} onChange={toggleViewMode} />

        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">
            {viewMode === "kanban" ? KANBAN_TITLE : LIST_TITLE}
          </h1>
          <ActionBar
            className={cn(
              "transition-shadow rounded-md",
              highlightDropdown ? "shadow-md shadow-primary" : "",
            )}
          />
        </div>

        {loadingNotes && firstLoadingNotes ? (
          <Loading />
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "kanban" ? (
              <motion.div
                key="kanban"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="kanban-board-container"
              >
                <NotesStatusBoard notes={userNotes} loading={loadingNotes} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full"
              >
                <ScrollArea className="w-full">
                  <div className="space-y-6">
                    {scheduledNotes.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900 p-4 rounded-lg mb-6 flex items-center text-red-800 dark:text-red-400"
                      >
                        <Info className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <span>
                            You have no scheduled notes in your queue.{" "}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {scheduledNotes.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 dark:bg-green-950/25 border border-green-200 dark:border-green-900 p-4 rounded-lg mb-6 flex items-center text-green-800 dark:text-green-400"
                      >
                        <Info className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>
                          You have {scheduledNotes.length}{" "}
                          {scheduledNotes.length === 1 ? "note" : "notes"}{" "}
                          scheduled.{" "}
                          {scheduledNotes.length === 1 &&
                          scheduledNotes[0].scheduledTo
                            ? `It will be published on `
                            : scheduledNotes.length > 1
                              ? `The last one will be published on `
                              : ""}
                          {scheduledNotes.length === 1 &&
                          scheduledNotes[0].scheduledTo ? (
                            <strong
                              className="underline cursor-pointer hover:no-underline transition-all"
                              onClick={scrollToLatestNote}
                            >
                              {scheduledNotes[0].scheduledTo &&
                                format(
                                  new Date(scheduledNotes[0].scheduledTo),
                                  "EEEE MMMM do, HH:mm",
                                )}
                            </strong>
                          ) : scheduledNotes.length > 1 ? (
                            (() => {
                              // Find the latest scheduled note
                              const latestNote = [...scheduledNotes].sort(
                                (a, b) =>
                                  new Date(b.scheduledTo || 0).getTime() -
                                  new Date(a.scheduledTo || 0).getTime(),
                              )[0];
                              return latestNote.scheduledTo ? (
                                <strong
                                  className="underline cursor-pointer hover:no-underline transition-all"
                                  onClick={scrollToLatestNote}
                                >
                                  {latestNote.scheduledTo &&
                                    format(
                                      new Date(latestNote.scheduledTo),
                                      "EEEE MMMM do, HH:mm",
                                    )}
                                </strong>
                              ) : null;
                            })()
                          ) : null}
                        </span>
                      </motion.div>
                    )}

                    <Tabs
                      defaultValue="scheduled"
                      value={activeTab}
                      onValueChange={handleUpdateActiveTab}
                      className="w-full"
                    >
                      <TabsList className="mb-4 border-b w-full rounded-none bg-transparent p-0 justify-start overflow-x-auto overflow-y-hidden">
                        <TabsTrigger
                          value="scheduled"
                          className={cn(
                            "rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary transition-all",
                          )}
                        >
                          Scheduled ({counters.scheduledCount})
                        </TabsTrigger>
                        <TabsTrigger
                          value="drafts"
                          className={cn(
                            "rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary transition-all relative",
                          )}
                        >
                          {/* If has new notes, show a circular badge like a notification 
                          animation should be smooth, and show a shadow for 2.3 seconds
                          */}
                          <AnimatePresence>
                            {hasNewNotes && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1 }}
                                transition={{ duration: 0.12 }}
                                className="absolute top-3 right-3 w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full shadow-red-600 dark:shadow-red-500 shadow-md"
                              />
                            )}
                          </AnimatePresence>
                          Drafts ({counters.draftCount})
                        </TabsTrigger>
                        <TabsTrigger
                          value="published"
                          className={cn(
                            "rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary transition-all",
                          )}
                        >
                          Published ({counters.publishedCount})
                        </TabsTrigger>
                        <TabsTrigger
                          value="all"
                          className={cn(
                            "rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary transition-all",
                          )}
                        >
                          All (
                          {counters.scheduledCount +
                            counters.draftCount +
                            counters.publishedCount}
                          )
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="scheduled" className="mt-0">
                        <ScheduledNotesList
                          days={activeDays}
                          onEditQueue={() =>
                            updateShowCreateScheduleDialog(true)
                          }
                          loading={loadingFetchingSchedules}
                          groupedNotes={groupedScheduledNotes()}
                          groupedSchedules={groupedSchedules()}
                          onSelectNote={handleSelectNote}
                          lastNoteRef={lastNoteRef}
                          lastNoteId={latestNoteId}
                        />
                      </TabsContent>

                      <TabsContent value="drafts" className="pb-6 md:pb-6">
                        {draftNotes.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-16 gap-6"
                          >
                            {didCreateNote ? (
                              <EmptyStateCard
                                onAddNote={() => {
                                  createDraftNote();
                                }}
                                onGenerateNotes={() => {
                                  updateShowGenerateNotesDialog(true);
                                }}
                                loading={loadingCreateNote}
                              />
                            ) : (
                              <CreateNewNoteInstructions />
                            )}
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          >
                            {draftNotes.map((note, index) => (
                              <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <NoteComponent note={note} />
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </TabsContent>

                      <TabsContent value="published">
                        {publishedNotes.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-16 gap-6"
                          >
                            <div className="text-center text-muted-foreground">
                              <p className="text-lg mb-2">
                                No published notes yet
                              </p>
                              <p className="text-sm">
                                Notes you publish will appear here
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          >
                            {publishedNotes.map((note, index) => (
                              <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <NoteComponent note={note} />
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </TabsContent>

                      <TabsContent value="all">
                        {scheduledNotes.length === 0 &&
                        draftNotes.length === 0 &&
                        publishedNotes.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-16 gap-6"
                          >
                            <div className="text-center text-muted-foreground">
                              <p className="text-lg mb-2">No notes yet</p>
                              <CreateNewNoteInstructions />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          >
                            {/* Combine all notes and sort them as specified */}
                            {[
                              ...scheduledNotes,
                              ...draftNotes,
                              ...publishedNotes,
                            ]
                              .sort((a, b) => {
                                // Sort by type first: scheduled > drafts > published
                                const getTypeOrder = (note: NoteDraft) => {
                                  if (note.scheduledTo) return 0; // Scheduled notes first
                                  if (note.status !== "published") return 1; // Then drafts
                                  return 2; // Then published notes
                                };

                                const typeA = getTypeOrder(a);
                                const typeB = getTypeOrder(b);

                                if (typeA !== typeB) return typeA - typeB;

                                // If same type, sort by createdAt date (newest first)
                                const dateA = new Date(
                                  a.createdAt || 0,
                                ).getTime();
                                const dateB = new Date(
                                  b.createdAt || 0,
                                ).getTime();
                                return dateB - dateA;
                              })
                              .map((note, index) => (
                                <motion.div
                                  key={note.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <NoteComponent note={note} />
                                </motion.div>
                              ))}
                          </motion.div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
