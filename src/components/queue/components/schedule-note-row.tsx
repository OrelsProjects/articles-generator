import React, { MouseEvent, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { NoteDraft } from "@/types/note";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Calendar,
  X,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";

interface ScheduleNoteRowProps {
  note: NoteDraft;
  onSelect: (note: NoteDraft) => void;
  onUnschedule?: (note: NoteDraft) => Promise<unknown>;
  isDragOverlay?: boolean;
}

// Helper functions
const hasImage = (note: NoteDraft) => {
  return note.attachments && note.attachments.length > 0;
};

const getImageUrl = (note: NoteDraft) => {
  if (!hasImage(note)) return "";
  return note.attachments![0].url;
};

export const ScheduleNoteRow: React.FC<ScheduleNoteRowProps> = ({
  note,
  onSelect,
  onUnschedule,
  isDragOverlay = false,
}) => {
  const [loadingUnschedule, setLoadingUnschedule] = useState(false);
  // Format the time from the note's scheduledTo date
  const time = note.scheduledTo
    ? format(new Date(note.scheduledTo), "HH:mm")
    : "";

  // If used as drag overlay, don't use sortable/droppable functionality
  if (isDragOverlay) {
    return (
      <div className="flex justify-between items-center p-3 mb-2 rounded-md bg-card border border-border transition-colors">
        <div className="flex flex-1 min-w-0">
          <div className="text-primary mr-2 bg-primary/10 rounded-md p-1.5">
            <CalendarClock size={16} />
          </div>
          <div className="text-sm text-muted-foreground min-w-[72px]">
            {time}
          </div>
          <div className="text-sm text-foreground ml-4 truncate max-w-md">
            {note.body || ""}
          </div>
        </div>
        {hasImage(note) && (
          <div className="h-10 w-10 rounded-md bg-secondary/40 ml-4 overflow-hidden flex-shrink-0">
            <Image
              src={getImageUrl(note)}
              alt="Attachment"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        {/* <div className="ml-2 text-muted-foreground">
          <GripVertical size={16} />
        </div> */}
      </div>
    );
  }

  // For actual component in the list, use sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    data: {
      type: "note",
      note,
    },
  });

  // Also make it droppable to support dropping notes on other notes
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${note.id}`,
    data: {
      type: "filled-slot",
      note,
      time: note.scheduledTo ? new Date(note.scheduledTo) : null,
    },
  });

  // Combine the refs for both sortable and droppable functionality
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  // Handle click to select the note
  const handleClick = () => {
    onSelect(note);
  };

  // Handle unschedule click
  const handleUnschedule = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the note when clicking unschedule
    if (onUnschedule) {
      setLoadingUnschedule(true);
      onUnschedule(note).finally(() => {
        setLoadingUnschedule(false);
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full flex justify-between items-center p-3 mb-2 rounded-md bg-card hover:bg-card/80 border border-border transition-colors relative cursor-pointer ${
        isOver ? "bg-secondary/40 border-primary" : ""
      }`}
      onClick={handleClick}
    >
      {/* Drag handle - only this part is draggable */}
      <div
        className="p-1 text-muted-foreground cursor-grab hover:text-foreground absolute -left-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </div>

      {/* Content area */}
      <div className="flex flex-1 min-w-0 items-center">
        <div className="text-primary mr-2 bg-primary/10 rounded-md p-1.5">
          <CalendarClock size={16} />
        </div>
        <div className="text-sm text-muted-foreground min-w-[72px]">{time}</div>
        <div className="text-sm text-foreground ml-4 truncate">
          {note.body || ""}
        </div>

        {hasImage(note) && (
          <div className="h-10 w-10 rounded-md bg-secondary/40 ml-4 overflow-hidden flex-shrink-0">
            <Image
              src={getImageUrl(note)}
              alt="Attachment"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Action buttons on the right */}
      <div className="flex items-center gap-2 ml-2">
        {/* Unschedule button */}
        {onUnschedule && (
          <TooltipButton
            variant="ghost"
            tooltipContent="Unschedule"
            onClick={handleUnschedule}
            className="text-muted-foreground hover:text-red-500 transition-colors p-2 z-10"
            title="Unschedule"
          >
            {loadingUnschedule ? (
              <Loader2 className="animate-spin text-red-500" size={16} />
            ) : (
              <X size={16} />
            )}
          </TooltipButton>
        )}
      </div>
    </div>
  );
};
