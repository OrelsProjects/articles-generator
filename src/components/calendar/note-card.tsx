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
  draft:
    "bg-gray-500/10 dark:bg-gray-500/20 text-slate-900 dark:text-slate-200",
  ready: "bg-amber-100 dark:bg-amber-500  text-foreground dark:text-slate-100",
  published: "bg-green-100 dark:bg-green-500 text-foreground dark:text-slate-100",
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
        statusColors[note.status as keyof typeof statusColors],
      )}
    >
      {/* <h4 className="font-medium truncate">{note.name || "Untitled Note"}</h4> */}
      <p className="text-xs line-clamp-2">{note.body}</p>
    </div>
  );
}
