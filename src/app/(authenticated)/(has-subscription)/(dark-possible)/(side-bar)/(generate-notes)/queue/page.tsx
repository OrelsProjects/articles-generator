"use client";

import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import QueuePage from "@/components/queue/queue-page";
import { useQueue } from "@/lib/hooks/useQueue";
import { Loader2 } from "lucide-react";

export default function NotesCalendarPage() {
  const { loading, error } = useNotesSchedule();
  const { getNextAvailableSchedule } = useQueue();

  console.log("getNextAvailableSchedule", getNextAvailableSchedule());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={20} />
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
