"use client";

import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotesStats } from "@/lib/hooks/useNotesStats";
import { CompactNoteComponent } from "@/components/stats/compact-note-component";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { NoteWithEngagementStats } from "@/types/notes-stats";
import { useWriter } from "@/lib/hooks/useWriter";

interface TopNotesTabsProps {
  isLoading?: boolean;
}

export function TopNotesTabs({ isLoading }: TopNotesTabsProps) {
  const { noteStats, loadingNotesForDate } = useNotesStats();

  const { fetchUserWriterData, writer } = useWriter();

  // TODO: Need to improve slice of statistics and fetch writers data with engagement and notes stats

  useEffect(() => {
    fetchUserWriterData();
  }, []);

  const { bestNotes, mostEngagedNotes } = useMemo(() => {
    if (!noteStats?.notes) {
      return { bestNotes: [], mostEngagedNotes: [] };
    }

    // Create a map of note stats for quick lookup
    const noteStatsMap = new Map(
      noteStats.notes.map(note => [
        note.id,
        {
          clicks:
            noteStats.totalClicks.find(r => r.noteId === note.id)?.total || 0,
          follows:
            noteStats.totalFollows.find(r => r.noteId === note.id)?.total || 0,
          paidSubscriptions:
            noteStats.totalPaidSubscriptions.find(r => r.noteId === note.id)
              ?.total || 0,
          freeSubscriptions:
            noteStats.totalFreeSubscriptions.find(r => r.noteId === note.id)
              ?.total || 0,
        },
      ]),
    );

    // Helper function to get initials from name
    const getInitials = (name: string | undefined) => {
      if (!name) return "UN";
      return name
        .split(" ")
        .map(part => part.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    // Helper function to check if photo URL is valid
    const isValidPhotoUrl = (url: string | undefined) => {
      if (!url) return false;
      return (
        url.startsWith("http") &&
        (url.includes("substackcdn") || url.includes("substack-post-media"))
      );
    };

    // Sort notes by reactions (best notes)
    const bestNotes: NoteWithEngagementStats[] = [...noteStats.notes]
      .sort((a, b) => (b.reactionCount || 0) - (a.reactionCount || 0))
      .slice(0, 10)
      .map(note => ({
        id: note.id,
        commentId: note.commentId,
        body: note.body,
        date: note.createdAt,
        handle: note.handle,
        name: note.authorName,
        photoUrl: isValidPhotoUrl(note.thumbnail) ? note.thumbnail! : "",
        reactionCount: note.reactionCount,
        commentsCount: note.commentsCount,
        restacks: note.restacks,
        totalClicks: noteStatsMap.get(note.id)?.clicks || 0,
        totalFollows: noteStatsMap.get(note.id)?.follows || 0,
        totalPaidSubscriptions:
          noteStatsMap.get(note.id)?.paidSubscriptions || 0,
        totalFreeSubscriptions:
          noteStatsMap.get(note.id)?.freeSubscriptions || 0,
        totalArr: 0,
        totalShareClicks: 0,
        initials: getInitials(note.authorName),
        attachments: note.attachments || [],
      }));

    // Sort notes by clicks (most engaged)
    const mostEngagedNotes: NoteWithEngagementStats[] = [...noteStats.notes]
      .sort((a, b) => {
        const aClicks = noteStatsMap.get(a.id)?.clicks || 0;
        const bClicks = noteStatsMap.get(b.id)?.clicks || 0;
        return bClicks - aClicks;
      })
      .slice(0, 10)
      .map(note => ({
        id: note.id,
        commentId: note.commentId,
        body: note.body,
        date: note.createdAt,
        handle: note.handle,
        name: note.authorName,
        photoUrl: isValidPhotoUrl(note.thumbnail) ? note.thumbnail! : "",
        reactionCount: note.reactionCount,
        commentsCount: note.commentsCount,
        restacks: note.restacks,
        totalClicks: noteStatsMap.get(note.id)?.clicks || 0,
        totalFollows: noteStatsMap.get(note.id)?.follows || 0,
        totalPaidSubscriptions:
          noteStatsMap.get(note.id)?.paidSubscriptions || 0,
        totalFreeSubscriptions:
          noteStatsMap.get(note.id)?.freeSubscriptions || 0,
        totalArr: 0,
        totalShareClicks: 0,
        initials: getInitials(note.authorName),
        attachments: note.attachments || [],
      }));

    return { bestNotes, mostEngagedNotes };
  }, [noteStats]);

  if (isLoading || loadingNotesForDate) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Top Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Top Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="best" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="best">Best Notes</TabsTrigger>
              <TabsTrigger value="engaged">Most Engaged</TabsTrigger>
            </TabsList>
            <TabsContent value="best" className="mt-4">
              <div className="space-y-4">
                {bestNotes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notes found
                  </p>
                ) : (
                  bestNotes.map(note => (
                    <div key={note.id} className="space-y-2">
                      <CompactNoteComponent note={note} loading={false} />
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="engaged" className="mt-4">
              <div className="space-y-4">
                {mostEngagedNotes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notes found
                  </p>
                ) : (
                  mostEngagedNotes.map(note => (
                    <div key={note.id} className="space-y-2">
                      <CompactNoteComponent note={note} loading={false} />
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
