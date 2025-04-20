"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { useQueue } from "@/lib/hooks/useQueue";
import { useNotes } from "@/lib/hooks/useNotes";
import { useAppSelector } from "@/lib/hooks/redux";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditScheduleDialog } from "./edit-schedule-dialog";
import { cn } from "@/lib/utils";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";
import NoteComponent from "@/components/ui/note-component";
import { ScheduledNotesList } from "./components";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { GenerateNotesDialog } from "@/components/notes/generate-notes-dialog";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import Link from "next/link";

export function QueuePage() {
  const [activeTabCache, setActiveTabCache] = useLocalStorage(
    "queue_active_tab",
    "scheduled",
  );
  const {
    scheduledNotes,
    draftNotes,
    publishedNotes,
    counters,
    nextPage,
    resetPage,
  } = useQueue();
  const [didSeeWarning, setDidSeeWarning] = useLocalStorage(
    "queue_did_see_warning",
    false,
  );
  const { selectNote, createDraftNote } = useNotes();
  const { userSchedules } = useAppSelector(state => state.notes);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeDays, setActiveDays] = useState<Date[]>([]);
  const [activeTab, setActiveTab] = useState("scheduled");

  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const lastNoteRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // if scroll is at 60% of the page, fetch more scheduled notes.
  // Make sure it doesn't trigger too many times, due to a fast scroll.
  useEffect(() => {
    const handleScroll = () => {
      console.log(
        "scroll",
        window.innerHeight,
        window.scroll,
        document.body.scrollHeight,
      );
      if (
        window.innerHeight + window.scrollY >=
        document.body.scrollHeight * 0.6
      ) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        console.log("fetching more scheduled notes");
        scrollTimeoutRef.current = setTimeout(() => {
          console.log("fetching more scheduled notes 2");
          nextPage();
        }, 100);
      }
    };
    const mainContentScroll = document.getElementById("main-content-scroll");
    if (mainContentScroll) {
      console.log("adding scroll event listener");
      mainContentScroll.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (mainContentScroll) {
        mainContentScroll.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleUpdateActiveTab = (tab: string) => {
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
    debugger;
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

  return (
    <ScrollArea className="container py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Queue</h1>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <TooltipButton
            tooltipContent="Start writing"
            variant="outline"
            onClick={() => createDraftNote()}
            className="items-center gap-2"
          >
            <Plus size={16} />
            New draft
          </TooltipButton>
          {activeTab === "scheduled" ? (
            <Button onClick={() => setIsEditDialogOpen(true)}>
              Edit queue
            </Button>
          ) : (
            <GenerateNotesDialog />
          )}
        </div>
      </div>

      {/* // Write a warning (yellow) telling users that scheduling notes are not working at the moment, with a see more button that will explain:
      // Substack has decided to add a bot-detection system to their notes sending system.
      // This bots stops me from sending any notes on your behalf and therefore I cannot schedule notes your notes.
      // I am working on a solution to this and will update you as soon as I have more information.
      //You can keep using the scheduling, but make sure to be available to post notes manually.
      // Feel free to contact me via a DM on Substack or email at support@writestack.io.

      Sorry for any inconvenience this may cause.
      //  */}

      {!didSeeWarning && (
        <>
          <div className="bg-yellow-50 dark:bg-yellow-950/25 border border-yellow-200 dark:border-yellow-900 p-4 rounded-md mb-6 flex items-center justify-between text-yellow-800 dark:text-yellow-400">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>
                Scheduling notes is not working at the moment. post notes
                manually.
                <Button
                  variant="link"
                  onClick={() => setShowWarningDialog(true)}
                  className="text-yellow-800 dark:text-yellow-400"
                >
                  See more
                </Button>
              </span>
            </div>
            <Button variant="ghost" onClick={() => setDidSeeWarning(true)}>
              <X size={16} />
            </Button>
          </div>

          <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Scheduling notes is not working at the moment.
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-sm">
                <p>
                  Substack has decided to add a bot-detection system to their
                  notes sending system.
                </p>
                <p>
                  This bots stops me from sending any notes on your behalf and
                  therefore I cannot schedule notes your notes.{" "}
                </p>
                <p>
                  <br />I am working on a solution to this and will update you
                  as soon as I have more information.
                </p>
                <p>
                  You can keep using the scheduling, but make sure to be
                  available to post notes manually.
                </p>
                <p>
                  <br />
                  Feel free to contact me via a DM on Substack or email at{" "}
                  <Button variant="link" asChild>
                    <Link href="mailto:support@writestack.io">
                      support@writestack.io
                    </Link>
                  </Button>
                  .
                </p>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </>
      )}

      {scheduledNotes.length === 0 && (
        <div className="bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900 p-4 rounded-md mb-6 flex items-center text-red-800 dark:text-red-400">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>You have no scheduled notes in your queue</span>
        </div>
      )}

      {scheduledNotes.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950/25 border border-green-200 dark:border-green-900 p-4 rounded-md mb-6 flex items-center text-green-800 dark:text-green-400">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>
            You have {scheduledNotes.length}{" "}
            {scheduledNotes.length === 1 ? "note" : "notes"} scheduled.{" "}
            {scheduledNotes.length === 1 && scheduledNotes[0].scheduledTo
              ? `it will be published on `
              : scheduledNotes.length > 1
                ? `the last one will be published on `
                : ""}
            {scheduledNotes.length === 1 && scheduledNotes[0].scheduledTo ? (
              <strong
                className="underline cursor-pointer"
                onClick={scrollToLatestNote}
              >
                {format(
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
                    className="underline cursor-pointer"
                    onClick={scrollToLatestNote}
                  >
                    {format(
                      new Date(latestNote.scheduledTo),
                      "EEEE MMMM do, HH:mm",
                    )}
                  </strong>
                ) : null;
              })()
            ) : null}
          </span>
        </div>
      )}

      <Tabs
        defaultValue="scheduled"
        value={activeTab}
        onValueChange={handleUpdateActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4 border-b w-full rounded-none bg-transparent p-0 justify-start">
          <TabsTrigger
            value="scheduled"
            className={cn(
              "rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            )}
          >
            Scheduled ({counters.scheduledCount})
          </TabsTrigger>
          <TabsTrigger
            value="drafts"
            className={cn(
              "rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            )}
          >
            Drafts ({counters.draftCount})
          </TabsTrigger>
          <TabsTrigger
            value="published"
            className={cn(
              "rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            )}
          >
            Published ({counters.publishedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-0">
          <ScheduledNotesList
            days={activeDays}
            groupedNotes={groupedScheduledNotes()}
            groupedSchedules={groupedSchedules()}
            onSelectNote={handleSelectNote}
            lastNoteRef={lastNoteRef}
            lastNoteId={latestNoteId}
          />
        </TabsContent>

        <TabsContent value="drafts">
          {draftNotes.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">No drafts yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftNotes.map(note => (
                <NoteComponent key={note.id} note={note} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published">
          {publishedNotes.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No published notes yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedNotes.map(note => (
                <NoteComponent key={note.id} note={note} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EditScheduleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </ScrollArea>
  );
}

export default QueuePage;
