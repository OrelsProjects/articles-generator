"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduledNotesList } from "@/components/queue/components";
import { CreateNoteButton } from "@/components/notes/create-note-button";
import NoteComponent from "@/components/ui/note-component";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";
import { Sparkles, StickyNote, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appName } from "@/lib/consts";

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
        Notes generator
      </Button>
    </div>
  </motion.div>
);

const CreateNewNoteInstructions = ({
  highlightDropdown,
  setHighlightDropdown,
}: {
  highlightDropdown: boolean;
  setHighlightDropdown: (value: boolean) => void;
}) => (
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

interface NotesTabsProps {
  // Tab state
  activeTab: string;
  onTabChange: (tab: string) => void;

  // Counters
  counters: {
    scheduledCount: number;
    draftCount: number;
    publishedCount: number;
  };

  // Notes data
  scheduledNotes: NoteDraft[];
  draftNotes: NoteDraft[];
  publishedNotes: NoteDraft[];

  // Scheduled notes specific data
  activeDays: Date[];
  groupedNotes: Record<string, NoteDraft[]>;
  groupedSchedules: Record<string, UserSchedule[]>;
  lastNoteRef: React.RefObject<HTMLDivElement>;
  lastNoteId?: string;

  // Loading states
  loadingFetchingSchedules: boolean;
  loadingCreateNote: boolean;

  // Handlers
  onSelectNote: (note: NoteDraft) => void;
  onEditQueue: () => void;
  onCreateNote: () => void;
  onGenerateNotes: () => void;

  // State for UI
  hasNewNotes: boolean;
  didCreateNote: boolean;
  highlightDropdown: boolean;
  setHighlightDropdown: (value: boolean) => void;

  // Latest note scroll handler
  scrollToLatestNote: () => void;

  // Ghostwriter
  isGhostwriter: boolean;
}

export default function NotesTabs({
  activeTab,
  onTabChange,
  counters,
  scheduledNotes,
  draftNotes,
  publishedNotes,
  activeDays,
  groupedNotes,
  groupedSchedules,
  lastNoteRef,
  lastNoteId,
  loadingFetchingSchedules,
  loadingCreateNote,
  onSelectNote,
  onEditQueue,
  onCreateNote,
  onGenerateNotes,
  hasNewNotes,
  didCreateNote,
  highlightDropdown,
  setHighlightDropdown,
  scrollToLatestNote,
  isGhostwriter,
}: NotesTabsProps) {
  return (
    <div className="space-y-6">
      {/* Info banners */}
      {scheduledNotes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900 p-4 rounded-lg mb-6 flex items-center text-red-800 dark:text-red-400"
        >
          <div className="flex-1">
            <span>You have no scheduled notes in your queue. </span>
          </div>
        </motion.div>
      )}

      {scheduledNotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 dark:bg-green-950/25 border border-green-200 dark:border-green-900 p-4 rounded-lg mb-6 flex items-center text-green-800 dark:text-green-400"
        >
          <span>
            You have {scheduledNotes.length}{" "}
            {scheduledNotes.length === 1 ? "note" : "notes"} scheduled.{" "}
            {scheduledNotes.length === 1 && scheduledNotes[0].scheduledTo
              ? `It will be published on `
              : scheduledNotes.length > 1
                ? `The last one will be published on `
                : ""}
            {scheduledNotes.length === 1 && scheduledNotes[0].scheduledTo ? (
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

      {/* Tabs */}
      <Tabs
        defaultValue="scheduled"
        value={activeTab}
        onValueChange={onTabChange}
        className="w-full"
      >
        <TabsList className="mb-4 border-b w-full rounded-none bg-transparent p-0 justify-start overflow-x-auto overflow-y-hidden">
          <TabsTrigger
            value="scheduled"
            className={cn(
              "rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary transition-all",
            )}
          >
            Scheduled notes ({counters.scheduledCount})
          </TabsTrigger>
          <TabsTrigger
            value="published"
            className={cn(
              "rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary transition-all",
            )}
          >
            Published notes ({counters.publishedCount})
          </TabsTrigger>
          {/* <TabsTrigger
            value="all"
            className={cn(
              "rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary transition-all",
            )}
          >
            All notes (
            {counters.scheduledCount +
              counters.draftCount +
              counters.publishedCount}
            )
          </TabsTrigger> */}
          <TabsTrigger
            value="drafts"
            className={cn(
              "rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary transition-all relative",
            )}
          >
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
        </TabsList>

        <TabsContent value="scheduled" className="mt-0">
          <ScheduledNotesList
            days={activeDays}
            onEditQueue={onEditQueue}
            loading={loadingFetchingSchedules}
            groupedNotes={groupedNotes}
            groupedSchedules={groupedSchedules}
            onSelectNote={onSelectNote}
            lastNoteRef={lastNoteRef}
            lastNoteId={lastNoteId}
            isGhostwriter={isGhostwriter}
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
                  onAddNote={onCreateNote}
                  onGenerateNotes={onGenerateNotes}
                  loading={loadingCreateNote}
                />
              ) : (
                <CreateNewNoteInstructions
                  highlightDropdown={highlightDropdown}
                  setHighlightDropdown={setHighlightDropdown}
                />
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
                  <NoteComponent
                    note={note}
                    isGhostwriterNote={isGhostwriter}
                  />
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
                <p className="text-lg mb-2">No published notes yet</p>
                <p className="text-sm">Notes you publish will appear here</p>
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
                  <NoteComponent
                    note={note}
                    isGhostwriterNote={isGhostwriter}
                  />
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
                <CreateNewNoteInstructions
                  highlightDropdown={highlightDropdown}
                  setHighlightDropdown={setHighlightDropdown}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Combine all notes and sort them as specified */}
              {[...scheduledNotes, ...draftNotes, ...publishedNotes]
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
                  const dateA = new Date(a.createdAt || 0).getTime();
                  const dateB = new Date(b.createdAt || 0).getTime();
                  return dateB - dateA;
                })
                .map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <NoteComponent
                      note={note}
                      isGhostwriterNote={isGhostwriter}
                    />
                  </motion.div>
                ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
