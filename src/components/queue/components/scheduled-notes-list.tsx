import React, { useState, RefObject } from "react";
import { format } from "date-fns";
import { NoteDraft } from "@/types/note";
import { UserSchedule } from "@/types/schedule";
import { DaySchedule } from "./day-schedule";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ScheduleNoteRow } from "./schedule-note-row";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { toast } from "react-toastify";
import { useNotes } from "@/lib/hooks/useNotes";

interface ScheduledNotesListProps {
  days: Date[];
  groupedNotes: Record<string, NoteDraft[]>;
  groupedSchedules: Record<string, UserSchedule[]>;
  onSelectNote: (note: NoteDraft) => void;
  lastNoteRef?: RefObject<HTMLDivElement>;
  lastNoteId?: string;
}

export const ScheduledNotesList: React.FC<ScheduledNotesListProps> = ({
  days,
  groupedNotes,
  groupedSchedules,
  onSelectNote,
  lastNoteRef,
  lastNoteId,
}) => {
  const { updateNoteStatus, createDraftNote } = useNotes();
  const { scheduleNoteById } = useNotesSchedule();
  const [activeDragNote, setActiveDragNote] = useState<NoteDraft | null>(null);

  // Configure basic sensors - no delay needed since we're using a drag handle
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Find which note is being dragged
    const noteId = active.id as string;

    // Find the note across all days
    for (const dateKey in groupedNotes) {
      const note = groupedNotes[dateKey].find(note => note.id === noteId);
      if (note) {
        setActiveDragNote(note);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragNote(null);
  };

  const handleRescheduleNote = async (noteId: string, newTime: Date) => {
    try {
      await scheduleNoteById(noteId, newTime);
    } catch (error) {
      toast.error("Failed to reschedule note");
    }
  };

  const handleUnscheduleNote = async (note: NoteDraft) => {
    try {
      await updateNoteStatus(note.id, "draft");
    } catch (error) {
      toast.error("Failed to unschedule note");
      console.error(error);
    }
  };

  const handleCreateDraftNote = async (date: Date) => {
    try {
      debugger;
      await createDraftNote({ scheduledTo: date });
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="space-y-6">
        {days.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const notesForDay = groupedNotes[dateKey] || [];
          const schedulesForDay = groupedSchedules[dateKey] || [];

          return (
            <DaySchedule
              key={dateKey}
              day={day}
              notes={notesForDay}
              schedules={schedulesForDay}
              onSelectNote={onSelectNote}
              onRescheduleNote={handleRescheduleNote}
              onUnscheduleNote={handleUnscheduleNote}
              lastNoteRef={lastNoteRef}
              lastNoteId={lastNoteId}
              onEmptySlotClick={handleCreateDraftNote}
            />
          );
        })}
      </div>

      {/* Drag Overlay - shown while dragging */}
      <DragOverlay>
        {activeDragNote && (
          <div style={{ transform: "rotate(12deg)" }} className="opacity-80">
            <ScheduleNoteRow
              note={activeDragNote}
              onSelect={() => {}}
              isDragOverlay
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
