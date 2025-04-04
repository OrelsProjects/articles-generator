"use client";

import { useNotesCalendar } from "@/lib/hooks/useNotesCalendar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { useNotes } from "@/lib/hooks/useNotes";

export default function NotesCalendarPage() {
  const { loading, error, updateNoteDate } = useNotesCalendar();
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
      <h1 className="text-2xl font-bold mb-6 px-4 pt-4">Notes Calendar</h1>
      <CalendarGrid
        notes={userNotes}
        onNoteUpdate={updateNoteDate}
      />
    </div>
  );
}
