import React from "react";
import { format } from "date-fns";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";
import { DaySchedule } from "./day-schedule";

interface ScheduledNotesListProps {
  days: Date[];
  groupedNotes: Record<string, NoteDraft[]>;
  groupedSchedules: Record<string, UserSchedule[]>;
  onSelectNote: (note: NoteDraft) => void;
}

export const ScheduledNotesList = ({ 
  days, 
  groupedNotes, 
  groupedSchedules, 
  onSelectNote 
}: ScheduledNotesListProps) => {
  return (
    <>
      {days.map(day => {
        const dateKey = format(day, "yyyy-MM-dd");
        const notesForDay = groupedNotes[dateKey] || [];
        const schedulesForDay = groupedSchedules[dateKey] || [];
        
        // Show all days, even if empty, for consistency
        return (
          <DaySchedule 
            key={dateKey} 
            day={day} 
            notes={notesForDay} 
            schedules={schedulesForDay} 
            onSelectNote={onSelectNote} 
          />
        );
      })}
    </>
  );
}; 