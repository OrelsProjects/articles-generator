import React, { useState, useCallback, RefObject } from "react";
import {
  format,
  addDays,
  startOfToday,
  isSameDay,
  parse,
  setHours,
  setMinutes,
} from "date-fns";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";
import { ScheduleNoteRow } from "./schedule-note-row";
import { EmptyScheduleSlot } from "./empty-schedule-slot";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface DayScheduleProps {
  day: Date;
  notes: NoteDraft[];
  schedules: UserSchedule[];
  onSelectNote: (note: NoteDraft) => void;
  onEmptySlotClick: (date: Date) => void;
  onRescheduleNote?: (noteId: string, newTime: Date) => void;
  onUnscheduleNote?: (note: NoteDraft) => Promise<unknown>;
  lastNoteRef?: RefObject<HTMLDivElement>;
  lastNoteId?: string;
  activeDropTarget?: string | null;
  useDndContext?: boolean;
}

// Helper type for combined items
type ScheduleItem = {
  type: "note" | "empty";
  time: string;
  timestamp: number;
  note?: NoteDraft;
  schedule?: UserSchedule;
  id: string;
};

export const DaySchedule = ({
  day,
  notes,
  schedules,
  onSelectNote,
  onEmptySlotClick,
  onRescheduleNote,
  onUnscheduleNote,
  lastNoteRef,
  lastNoteId,
  activeDropTarget,
  useDndContext = true, // Default to true for backward compatibility
}: DayScheduleProps) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = isSameDay(day, startOfToday());
  const isTomorrow = isSameDay(day, addDays(startOfToday(), 1));
  const [dragOrigin, setDragOrigin] = useState<string | null>(null);

  // Configure sensors with no delay since we're using a drag handle
  const sensors = useSensors(useSensor(PointerSensor));

  // Function to get a time string from a schedule
  const getScheduleTimeString = (schedule: UserSchedule) => {
    // Convert to 24-hour format
    let hour24 = schedule.hour;
    if (schedule.ampm === "pm" && hour24 < 12) hour24 += 12;
    if (schedule.ampm === "am" && hour24 === 12) hour24 = 0;

    return `${hour24.toString().padStart(2, "0")}:${schedule.minute.toString().padStart(2, "0")}`;
  };

  // Function to get a time string from a note
  const getNoteTimeString = (note: NoteDraft) => {
    if (!note.scheduledTo) return "";
    return format(new Date(note.scheduledTo), "HH:mm");
  };

  // Convert time string to timestamp for sorting
  const timeStringToTimestamp = (timeStr: string) => {
    try {
      // Parse different time formats
      let date = new Date();

      if (timeStr.includes(":")) {
        const [hourStr, minuteStr] = timeStr.split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (!isNaN(hour) && !isNaN(minute)) {
          date.setHours(hour, minute, 0, 0);
          return hour * 60 + minute;
        }
      }

      // Fallback if format is unexpected
      return 0;
    } catch (e) {
      console.error("Error parsing time:", timeStr, e);
      return 0;
    }
  };

  // Parse time string to Date object for a given day
  const parseTimeToDate = (timeStr: string, day: Date) => {
    try {
      // Create a new date object with the given day
      const date = new Date(day);

      // Extract hours and minutes from 24-hour format
      const [hourStr, minuteStr] = timeStr.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      // Set the hours and minutes
      date.setHours(hour, minute, 0, 0);

      return date;
    } catch (e) {
      console.error("Error parsing time to date:", timeStr, e);
      return new Date();
    }
  };

  // Create a combined array of scheduled items (both notes and empty slots)
  const allScheduledItems: ScheduleItem[] = [];

  // Add all scheduled notes
  notes.forEach(note => {
    if (note.scheduledTo) {
      const timeStr = getNoteTimeString(note);
      const timestamp = timeStringToTimestamp(timeStr);

      // Show all notes regardless of the time
      allScheduledItems.push({
        type: "note",
        time: timeStr,
        timestamp,
        note,
        id: note.id,
      });
    }
  });

  // Add all schedule slots (whether they have content or not)
  schedules.forEach((schedule, index) => {
    const timeStr = getScheduleTimeString(schedule);
    const timestamp = timeStringToTimestamp(timeStr);

    // Check if there's already a note scheduled at this time
    const existingNoteIndex = allScheduledItems.findIndex(
      item => item.type === "note" && Math.abs(item.timestamp - timestamp) < 5, // Within 5 minutes
    );

    if (existingNoteIndex === -1) {
      // No note at this time, add an empty slot
      allScheduledItems.push({
        type: "empty",
        time: timeStr,
        timestamp,
        schedule,
        id: `empty-${day.toISOString()}-${timeStr}-${index}`,
      });
    }
    // If there's a note, we already have it in the list so we don't add a duplicate
  });

  // Sort all items by time
  allScheduledItems.sort((a, b) => a.timestamp - b.timestamp);

  // Handle drag start event
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDragOrigin(active.id as string);
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      // If dropped in empty space or same location, do nothing
      setDragOrigin(null);
      return;
    }

    // Check if this is a drop back at the original position
    if (over.id === dragOrigin || over.id === `droppable-${dragOrigin}`) {
      // Dropped back in original position, do nothing
      setDragOrigin(null);
      return;
    }

    // Handle different drop scenarios

    // First, get the active item (the note being dragged)
    const activeNoteId = active.id as string;
    const draggedNote = notes.find(note => note.id === activeNoteId);

    if (!draggedNote || !onRescheduleNote) {
      setDragOrigin(null);
      return;
    }

    // Two possible scenarios for the drop target:
    // 1. Empty slot - use its time directly
    // 2. Droppable area of another note - use that note's time

    // Check if dropped on an empty slot (id starts with "empty-")
    if (typeof over.id === "string" && over.id.startsWith("empty-")) {
      const emptySlot = allScheduledItems.find(item => item.id === over.id);
      if (emptySlot && emptySlot.time) {
        const newDateTime = parseTimeToDate(emptySlot.time, day);
        onRescheduleNote(activeNoteId, newDateTime);
      }
    }
    // Check if dropped on another note's droppable area
    else if (typeof over.id === "string" && over.id.startsWith("droppable-")) {
      const targetNoteId = over.id.replace("droppable-", "");
      const targetNote = notes.find(note => note.id === targetNoteId);

      if (targetNote && targetNote.scheduledTo) {
        // Use the target note's scheduled time
        onRescheduleNote(activeNoteId, new Date(targetNote.scheduledTo));
      }
    }

    setDragOrigin(null);
  };
  // Get the day title
  const dayTitle = (
    <h2 className="text-lg font-semibold mb-2">
      {isToday ? "Today" : isTomorrow ? "Tomorrow" : format(day, "EEEE")} |{" "}
      {format(day, "MMMM d")}
    </h2>
  );

  // Skip days with no notes or schedules
  if (notes.length === 0 && schedules.length === 0) {
    return null;
  }

  // Render content with or without DndContext
  const renderScheduleItems = () =>
    allScheduledItems.map(item => (
      <React.Fragment key={item.id}>
        {item.type === "note" && item.note && (
          <div
            ref={item.note.id === lastNoteId ? lastNoteRef : undefined}
            className={
              activeDropTarget === item.id ||
              activeDropTarget === `droppable-${item.id}`
                ? "ring-2 ring-primary rounded-md"
                : ""
            }
          >
            <ScheduleNoteRow
              note={item.note}
              onSelect={onSelectNote}
              onUnschedule={onUnscheduleNote}
            />
          </div>
        )}
        {item.type === "empty" && (
          <div
            className={
              activeDropTarget === item.id
                ? "ring-2 ring-primary rounded-md"
                : ""
            }
          >
            <EmptyScheduleSlot
              id={item.id}
              time={item.time}
              date={day}
              onClick={onEmptySlotClick}
            />
          </div>
        )}
      </React.Fragment>
    ));

  return (
    <div className="mb-6">
      {dayTitle}

      {useDndContext ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          {renderScheduleItems()}
        </DndContext>
      ) : (
        renderScheduleItems()
      )}

      {/* If no items were found and not today, show generic message */}
      {allScheduledItems.length === 0 && !isToday && (
        <EmptyScheduleSlot
          id={`empty-${day.toISOString()}-default`}
          message='Press "Add to queue" to place your note here'
          date={day}
          onClick={onEmptySlotClick}
        />
      )}
    </div>
  );
};
