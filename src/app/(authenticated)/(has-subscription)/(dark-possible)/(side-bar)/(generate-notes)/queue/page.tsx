"use client";

import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import QueuePage from "@/components/queue/queue-page";
import { useQueue } from "@/lib/hooks/useQueue";

export default function NotesCalendarPage() {
  const { loading, error } = useNotesSchedule();
  const { getNextAvailableSchedule } = useQueue();

  console.log("getNextAvailableSchedule", getNextAvailableSchedule());

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
    <div className="w-screen md:container mx-auto">
      <QueuePage />
    </div>
  );
}
