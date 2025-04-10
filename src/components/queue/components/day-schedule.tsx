import React from "react";
import { format, addDays, startOfToday, isSameDay, parse } from "date-fns";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";
import { ScheduleNoteRow } from "./schedule-note-row";
import { EmptyScheduleSlot } from "./empty-schedule-slot";

interface DayScheduleProps {
  day: Date;
  notes: NoteDraft[];
  schedules: UserSchedule[];
  onSelectNote: (note: NoteDraft) => void;
}

// Helper type for combined items
type ScheduleItem = {
  type: 'note' | 'empty';
  time: string;
  timestamp: number;
  note?: NoteDraft;
  schedule?: UserSchedule;
};

export const DaySchedule = ({ 
  day, 
  notes, 
  schedules, 
  onSelectNote 
}: DayScheduleProps) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = isSameDay(day, startOfToday());
  const isTomorrow = isSameDay(day, addDays(startOfToday(), 1));
  
  // Skip days with no notes or schedules
  if (notes.length === 0 && schedules.length === 0) {
    return null;
  }

  // Function to get a time string from a schedule
  const getScheduleTimeString = (schedule: UserSchedule) => {
    return `${schedule.hour}:${schedule.minute.toString().padStart(2, "0")} ${schedule.ampm}`;
  };

  // Function to get a time string from a note
  const getNoteTimeString = (note: NoteDraft) => {
    if (!note.scheduledTo) return "";
    return format(new Date(note.scheduledTo), "h:mm a");
  };

  // Convert time string to timestamp for sorting
  const timeStringToTimestamp = (timeStr: string) => {
    try {
      // Parse different time formats
      let date;
      if (timeStr.includes(':')) {
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          date = parse(timeStr, "h:mm a", new Date());
        } else {
          const [hourStr, rest] = timeStr.split(':');
          const [minuteStr, ampmStr] = rest.split(' ');
          date = parse(`${hourStr}:${minuteStr} ${ampmStr}`, "h:mm a", new Date());
        }
      } else {
        // Fallback if format is unexpected
        return 0;
      }
      return date.getHours() * 60 + date.getMinutes();
    } catch (e) {
      console.error("Error parsing time:", timeStr, e);
      return 0;
    }
  };

  // Create a combined array of scheduled items (both notes and empty slots)
  const allScheduledItems: ScheduleItem[] = [];

  // Add all scheduled notes
  notes.forEach(note => {
    if (note.scheduledTo) {
      const timeStr = getNoteTimeString(note);
      const timestamp = timeStringToTimestamp(timeStr);
      
      // For today, only include notes scheduled for later
      if (!isToday || timestamp >= currentMinutes) {
        allScheduledItems.push({
          type: 'note',
          time: timeStr,
          timestamp,
          note
        });
      }
    }
  });

  // Add all schedule slots (whether they have content or not)
  schedules.forEach(schedule => {
    const timeStr = getScheduleTimeString(schedule);
    const timestamp = timeStringToTimestamp(timeStr);
    
    // For today, only include schedules for later
    if (!isToday || timestamp >= currentMinutes) {
      // Check if there's already a note scheduled at this time
      const existingNoteIndex = allScheduledItems.findIndex(
        item => item.type === 'note' && Math.abs(item.timestamp - timestamp) < 5 // Within 5 minutes
      );
      
      if (existingNoteIndex === -1) {
        // No note at this time, add an empty slot
        allScheduledItems.push({
          type: 'empty',
          time: timeStr,
          timestamp,
          schedule
        });
      }
    }
    // If there's a note, we already have it in the list so we don't add a duplicate
  });

  // Sort all items by time
  allScheduledItems.sort((a, b) => a.timestamp - b.timestamp);

  // Get the day title
  const dayTitle = (
    <h2 className="text-lg font-semibold mb-2">
      {isToday
        ? "Today"
        : isTomorrow
          ? "Tomorrow"
          : format(day, "EEEE")}{" "}
      | {format(day, "MMMM d")}
    </h2>
  );

  // If today and no future items, just show the title
  if (isToday && allScheduledItems.length === 0) {
    return <div className="mb-6">{dayTitle}</div>;
  }

  return (
    <div className="mb-6">
      {dayTitle}

      {/* Render all scheduled items in order */}
      {allScheduledItems.map((item, index) => (
        <React.Fragment key={`${day.toISOString()}-${index}`}>
          {item.type === 'note' && item.note && (
            <ScheduleNoteRow 
              note={item.note} 
              onSelect={onSelectNote} 
            />
          )}
          {item.type === 'empty' && (
            <EmptyScheduleSlot message={`Press "Add to queue" to place your note here at ${item.time}`} />
          )}
        </React.Fragment>
      ))}
      
      {/* If no items were found and not today, show generic message */}
      {allScheduledItems.length === 0 && !isToday && (
        <EmptyScheduleSlot message='Press "Add to queue" to place your note here' />
      )}
    </div>
  );
}; 