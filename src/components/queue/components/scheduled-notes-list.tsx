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
  DragOverEvent,
  closestCenter,
} from "@dnd-kit/core";
import { ScheduleNoteRow } from "./schedule-note-row";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { toast } from "react-toastify";
import { useNotes } from "@/lib/hooks/useNotes";
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";

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
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  // Configure basic sensors for drag detection
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

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

  // Prepare a map of all empty slots
  const emptySlotMap = React.useMemo(() => {
    const map = new Map<string, { day: Date; time: string }>();
    
    days.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      const schedulesForDay = groupedSchedules[dateKey] || [];
      
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
  }, [days, groupedSchedules]);

  // Build a single list of all draggable notes across all days
  const allDraggableIds = React.useMemo(() => {
    const ids: string[] = [];
    for (const dateKey in groupedNotes) {
      groupedNotes[dateKey].forEach(note => {
        ids.push(note.id);
      });
    }
    return ids;
  }, [groupedNotes]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Find which note is being dragged
    const noteId = active.id as string;
    const note = findNoteById(noteId);
    
    if (note) {
      setActiveDragNote(note);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setActiveDropTarget(over.id as string);
    } else {
      setActiveDropTarget(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDragNote(null);
    setActiveDropTarget(null);
    
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
        
        console.log(`Rescheduling note ${noteId} to ${newDate.toISOString()}`);
        
        // Try to reschedule
        handleRescheduleNote(noteId, newDate);
      }
    }
    // Handle dropping on another note (for swapping schedules)
    else if (typeof over.id === "string" && over.id !== noteId) {
      const targetNote = findNoteById(over.id);
      
      if (targetNote && targetNote.scheduledTo) {
        const targetDate = new Date(targetNote.scheduledTo);
        console.log(`Rescheduling note ${noteId} to ${targetDate.toISOString()}`);
        
        handleRescheduleNote(noteId, targetDate);
      }
    }
  };

  const handleRescheduleNote = async (noteId: string, newTime: Date) => {
    const toastId = toast.loading("Rescheduling note...");
    try {
      await scheduleNoteById(noteId, newTime);
      toast.update(toastId, {
        render: "Note rescheduled",
        type: "success",
        isLoading: false,
        autoClose: 1500
      });
    } catch (error) {
      toast.update(toastId, {
        render: "Failed to reschedule note",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
      console.error(error);
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
      await createDraftNote({ scheduledTo: date });
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <SortableContext items={allDraggableIds} strategy={verticalListSortingStrategy}>
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
                onUnscheduleNote={handleUnscheduleNote}
                lastNoteRef={lastNoteRef}
                lastNoteId={lastNoteId}
                onEmptySlotClick={handleCreateDraftNote}
                activeDropTarget={activeDropTarget}
                useDndContext={false} // Don't create another DndContext
              />
            );
          })}
        </div>
      </SortableContext>
      
      {/* Drag Overlay - shown while dragging */}
      <DragOverlay>
        {activeDragNote && (
          <div className="opacity-90">
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
