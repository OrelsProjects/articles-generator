"use client";

import { NoteDraft } from "@/types/note";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface NoteCardProps {
  note: NoteDraft;
  onClick: () => void;
}

const statusColors = {
  draft: "bg-card",
  ready: "bg-amber-100 dark:bg-amber-900",
  published: "bg-green-100 dark:bg-green-900",
};

export function NoteCard({ note, onClick }: NoteCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    data: note,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg shadow-sm cursor-pointer mb-2",
        "hover:shadow-md transition-shadow",
        statusColors[note.status],
      )}
    >
      <h4 className="font-medium truncate">{note.name || "Untitled Note"}</h4>
      <p className="text-sm text-muted-foreground truncate">{note.body}</p>
    </div>
  );
}
