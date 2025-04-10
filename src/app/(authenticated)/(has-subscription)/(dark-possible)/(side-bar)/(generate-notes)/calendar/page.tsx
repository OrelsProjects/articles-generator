"use client";

import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { useNotes } from "@/lib/hooks/useNotes";
import { EditScheduleDialog } from "@/components/queue/edit-schedule-dialog";
import QueuePage from "@/components/queue/queue-page";

export default function NotesCalendarPage() {
  const { loading, error, scheduleNote: updateNoteDate } = useNotesSchedule();
  const { userNotes } = useNotes();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading your notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <QueuePage />
    </div>
  );
}
