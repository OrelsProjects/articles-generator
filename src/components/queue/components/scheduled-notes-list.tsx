import React, { useState, RefObject, useMemo } from "react";
import { format, isBefore, isToday } from "date-fns";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";
import { DaySchedule } from "./day-schedule";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  closestCenter,
} from "@dnd-kit/core";
import { ScheduleNoteRow } from "./schedule-note-row";
import { toast } from "react-toastify";
import { useNotes } from "@/lib/hooks/useNotes";
import { CustomDragOverlay } from "./custom-drag-overlay";
import { useDragOverlay } from "../hooks/useDragOverlay";
import { Logger } from "@/logger";
import { Calendar, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ScheduledNotesListProps {
  days: Date[];
  groupedNotes: Record<string, NoteDraft[]>;
  groupedSchedules: Record<string, UserSchedule[]>;
  onSelectNote: (note: NoteDraft) => void;
  onEditQueue: () => void;
  lastNoteRef?: RefObject<HTMLDivElement>;
  lastNoteId?: string;
  loading?: boolean;
}

export const ScheduledNotesList: React.FC<ScheduledNotesListProps> = ({
  days,
  groupedNotes,
  groupedSchedules,
  onSelectNote,
  lastNoteRef,
  lastNoteId,
  onEditQueue,
  loading,
}) => {
  const { updateNoteStatus, createDraftNote, rescheduleNote } = useNotes();

  // Configure basic sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor),
  );

  // Find a note by its ID across all days
  const findNoteById = (noteId: string): NoteDraft | null => {
    for (const dateKey in groupedNotes) {
      const note = groupedNotes[dateKey].find(note => note.id === noteId);
      if (note) {
        return note;
      }
    }
    return null;
  };

  // Use our custom drag overlay hook
  const {
    activeDragItem: activeDragNote,
    activeDropTarget,
    handleDragStart,
    handleDragEnd: onDragEnd,
    setActiveDropTarget,
  } = useDragOverlay({
    findItemById: findNoteById,
  });

  // Filter out schedules from today that have already passed and don't have a note
  const filteredGroupedSchedules = React.useMemo(() => {
    const now = new Date();
    const filtered = { ...groupedSchedules };

    // Get today's date key
    const todayKey = format(now, "yyyy-MM-dd");

    if (filtered[todayKey]) {
      // Filter schedules for today
      filtered[todayKey] = filtered[todayKey].filter(schedule => {
        // Convert schedule time to a Date object for comparison
        let scheduleHour = schedule.hour;
        if (schedule.ampm === "pm" && scheduleHour < 12) scheduleHour += 12;
        if (schedule.ampm === "am" && scheduleHour === 12) scheduleHour = 0;

        const scheduleDate = new Date(now);
        scheduleDate.setHours(scheduleHour, schedule.minute, 0, 0);

        // Check if this time has a scheduled note
        const notesForToday = groupedNotes[todayKey] || [];
        const hasNoteAtThisTime = notesForToday.some(note => {
          if (!note.scheduledTo) return false;
          const noteDate = new Date(note.scheduledTo);
          return (
            noteDate.getHours() === scheduleHour &&
            noteDate.getMinutes() === schedule.minute
          );
        });

        // Keep the schedule if it's in the future or has a note scheduled
        return !isBefore(scheduleDate, now) || hasNoteAtThisTime;
      });
    }

    return filtered;
  }, [groupedSchedules, groupedNotes]);

  // Prepare a map of all empty slots
  const emptySlotMap = React.useMemo(() => {
    const map = new Map<string, { day: Date; time: string }>();

    days.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      const schedulesForDay = filteredGroupedSchedules[dateKey] || [];

      schedulesForDay.forEach((schedule, index) => {
        // Convert to 24-hour format
        let hour24 = schedule.hour;
        if (schedule.ampm === "pm" && hour24 < 12) hour24 += 12;
        if (schedule.ampm === "am" && hour24 === 12) hour24 = 0;

        const timeStr = `${hour24.toString().padStart(2, "0")}:${schedule.minute.toString().padStart(2, "0")}`;
        const slotId = `empty-${day.toISOString()}-${timeStr}-${index}`;

        map.set(slotId, { day, time: timeStr });
      });
    });

    return map;
  }, [days, filteredGroupedSchedules]);

  // Handle dragOver to update the active drop target
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setActiveDropTarget(over.id as string);
    } else {
      setActiveDropTarget(null);
    }
  };

  const handleRescheduleNote = async (noteId: string, newTime: Date) => {
    const toastId = toast.loading("Rescheduling note...");
    try {
      const note = findNoteById(noteId);
      if (!note) {
        throw new Error("Note not found");
      }

      await rescheduleNote(noteId, newTime, {
        showToast: true,
      });
      toast.update(toastId, {
        render: "Note rescheduled",
        type: "success",
        isLoading: false,
        autoClose: 1500,
      });
    } catch (error: any) {
      Logger.error("Error rescheduling note", { error });
    }
  };

  // Handle final drag end with rescheduling logic
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Run the base drag end handler from our hook
    onDragEnd(event);

    if (active.id === over?.id) return;

    if (!over) return; // Dropped outside a valid target

    const noteId = active.id as string;
    const draggedNote = findNoteById(noteId);

    if (!draggedNote) return;

    // Handle dropping on an empty slot (these IDs start with "empty-")
    if (typeof over.id === "string" && over.id.startsWith("empty-")) {
      const slotInfo = emptySlotMap.get(over.id);

      if (slotInfo) {
        const { day, time } = slotInfo;
        const [hourStr, minuteStr] = time.split(":");
        const hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);

        // Create date object for the new scheduled time
        const newDate = new Date(day);
        newDate.setHours(hour, minute, 0, 0);

        Logger.info(`Rescheduling note ${noteId} to ${newDate.toISOString()}`);

        // Try to reschedule
        handleRescheduleNote(noteId, newDate);
      }
    }
    // Handle dropping on another note
    else if (typeof over.id === "string") {
      const targetNote = findNoteById(over.id);

      if (targetNote && targetNote.scheduledTo) {
        const targetDate = new Date(targetNote.scheduledTo);
        Logger.info(
          `Rescheduling note ${noteId} to ${targetDate.toISOString()}`,
        );

        handleRescheduleNote(noteId, targetDate);
      }
    }
    // Remove handling for dropping directly on other notes to prevent swapping
  };

  const handleUnscheduleNote = async (note: NoteDraft) => {
    try {
      await updateNoteStatus(note.id, "draft");
    } catch (error) {
      toast.error("Failed to unschedule note");
      Logger.error("Failed to unschedule note", {
        error: JSON.stringify(error),
      });
    }
  };

  const handleCreateDraftNote = async (date: Date) => {
    try {
      await createDraftNote({ scheduledTo: date });
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  // Check if a note is scheduled in the past
  const isNotePastScheduled = (note: NoteDraft): boolean => {
    if (!note.scheduledTo) return false;
    const scheduleDate = new Date(note.scheduledTo);
    return isBefore(scheduleDate, new Date());
  };

  const hasAnyNotesScheduled = useMemo(() => {
    return Object.values(groupedNotes).some(notes =>
      notes.some(note => note.scheduledTo),
    );
  }, [groupedNotes]);

  const hasQueue = Object.keys(filteredGroupedSchedules).length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAnyNotesScheduled && !hasQueue) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-6 py-16 text-center"
      >
        <h3 className="text-2xl font-bold text-foreground">No schedule yet</h3>

        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Set your posting times once. Every new note can be scheduled into the
          next slot with one click.
        </p>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          You can edit your schedule anytime.
        </p>

        <Button onClick={onEditQueue}>
          <Calendar className="mr-2 h-4 w-4" />
          Create schedule
        </Button>
      </motion.div>
    );
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute top-0 right-0 flex justify-end">
          <Button
            variant="link-foreground"
            className="py-0 items-start"
            onClick={onEditQueue}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Edit Queue
          </Button>
        </div>
        <div className="space-y-8">
          {days.map(day => {
            const dateKey = format(day, "yyyy-MM-dd");
            const notesForDay = groupedNotes[dateKey] || [];
            const schedulesForDay = filteredGroupedSchedules[dateKey] || [];

            return (
              <DaySchedule
                key={dateKey}
                day={day}
                notes={notesForDay}
                schedules={schedulesForDay}
                onSelectNote={onSelectNote}
                onUnscheduleNote={handleUnscheduleNote}
                lastNoteRef={lastNoteRef}
                lastNoteId={lastNoteId}
                onEmptySlotClick={handleCreateDraftNote}
                activeDropTarget={activeDropTarget}
                useDndContext={false} // Don't create another DndContext
                isPastScheduled={isNotePastScheduled} // Pass function to check past scheduled notes
              />
            );
          })}
        </div>

        {/* Using our custom drag overlay component */}
        <CustomDragOverlay className="w-full">
          {activeDragNote && (
            <div className="opacity-90">
              <ScheduleNoteRow
                note={activeDragNote}
                onSelect={() => {}}
                isDragOverlay
              />
            </div>
          )}
        </CustomDragOverlay>
      </motion.div>
    </DndContext>
  );
};
