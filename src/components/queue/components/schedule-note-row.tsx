import React, { useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { NoteDraft } from "@/types/note";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  X,
  CalendarClock,
  Loader2,
  AlertTriangle,
  Clock,
  CircleAlert,
} from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { InstantPostButton } from "@/components/notes/instant-post-button";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks/redux";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AttachmentType } from "@prisma/client";

interface ScheduleNoteRowProps {
  note: NoteDraft;
  onSelect: (note: NoteDraft) => void;
  onUnschedule?: (note: NoteDraft) => Promise<unknown>;
  isDragOverlay?: boolean;
  isPastScheduled?: boolean;
  isDropTarget?: boolean;
}

// Helper functions
const hasImage = (note: NoteDraft) => {
  return (
    note.attachments &&
    note.attachments.length > 0 &&
    note.attachments.some(
      attachment => attachment.type === AttachmentType.image,
    )
  );
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
  isPastScheduled = false,
  isDropTarget = false,
}) => {
  const { schedulesDiscrepancies } = useAppSelector(state => state.notes);
  const [loadingUnschedule, setLoadingUnschedule] = useState(false);
  // Format the time from the note's scheduledTo date
  const time = note.scheduledTo
    ? format(new Date(note.scheduledTo), "HH:mm")
    : "";

  const hasDiscrepancy = schedulesDiscrepancies.some(
    discrepancy => discrepancy.noteId === note.id,
  );

  // If used as drag overlay, don't use sortable/droppable functionality
  if (isDragOverlay) {
    return (
      <div className="flex justify-between items-center p-3 mb-2 rounded-md bg-card border border-border transition-colors">
        <div className="flex flex-1 min-w-0">
          <div className="text-primary mr-2 bg-primary/10 rounded-md p-1.5 flex flex-row items-center hover:bg-foreground/20 transition-colors">
            <CalendarClock size={16} />
            {hasDiscrepancy && !isPastScheduled && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="h-4 w-4 text-amber-500 hidden md:flex" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Schedule discrepancy detected. Please reschedule this
                      note.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div
            className={cn(
              "text-sm min-w-[72px]",
              isPastScheduled ? "text-red-500" : "text-muted-foreground",
            )}
          >
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
        <div className="ml-2 text-muted-foreground">
          <GripVertical size={16} />
        </div>
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

  // Prevent drag when clicking on action buttons
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        `w-full flex justify-between items-center mb-2 rounded-md bg-card hover:bg-card/80 border border-border transition-colors relative cursor-pointer`,
        {
          "cursor-grabbing": isOver,
          "bg-secondary/40 border-primary": isOver,
          "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950":
            isDropTarget,
        },
      )}
      onClick={handleClick}
    >
      {/* Content area */}
      <div
        className={cn(
          "flex flex-1 min-w-0 items-center p-3 cursor-pointer active:cursor-grabbing",
          { "cursor-grabbing": isOver },
        )}
        {...attributes}
        {...listeners}
      >
        <div className="flex flex-row items-center gap-2">
          {hasDiscrepancy && !isPastScheduled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Schedule discrepancy detected. Please reschedule this note.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isPastScheduled && (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger>
                  <CircleAlert className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    This note was scheduled to be posted in the past and was not
                    sent.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div
            className={cn(
              "text-primary mr-2 bg-primary/10 rounded-md p-1.5",
              isPastScheduled &&
                "text-red-500 bg-red-100 dark:bg-red-950/30 py-0.5",
            )}
          >
            {isPastScheduled ? <p>missed</p> : <CalendarClock size={16} />}
          </div>
        </div>
        <div
          className={cn(
            "text-sm min-w-[72px]",
            isPastScheduled ? "text-red-500" : "text-muted-foreground",
          )}
        >
          {time}
        </div>
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
      <div className="flex items-center gap-2 mr-2" onClick={handleActionClick}>
        {/* Past schedule indicator */}
        {isPastScheduled && (
          <InstantPostButton
            noteId={note.id}
            source="schedule"
            showText={false}
            className="text-muted-foreground transition-colors p-2 z-10"
          />
        )}

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
