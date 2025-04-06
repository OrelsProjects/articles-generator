"use client";

import { useState, useCallback, useEffect } from "react";
import { StatusBoard } from "@/components/ui/status-board/status-board";
import { StatusColumn, StatusItem } from "@/components/ui/status-board/types";
import { NoteDraft, NoteStatus } from "@/types/note";
import { useNotes } from "@/lib/hooks/useNotes";
import { toast } from "react-toastify";
import { UniqueIdentifier } from "@dnd-kit/core";
import { FileText, Clock, CheckCircle, Archive } from "lucide-react";

export interface NotesStatusBoardProps {
  notes: NoteDraft[];
}

export function NotesStatusBoard({ notes }: NotesStatusBoardProps) {
  const { updateNoteStatus, createDraftNote, selectNote, selectedNote } =
    useNotes();
  const [isUpdating, setIsUpdating] = useState(false);
  const [columns, setColumns] = useState<StatusColumn[]>([]);

  // Convert notes to status items
  const convertToStatusItems = useCallback(
    (notes: NoteDraft[]): StatusItem[] => {
      return notes.map(note => ({
        id: note.id,
        content:
          note.body.substring(0, 100) + (note.body.length > 100 ? "..." : ""),
        status: note.status,
        author: note.authorName,
        avatar: note.thumbnail,
        createdAt: new Date(note.createdAt).toLocaleDateString(),
        noteDraft: note,
      }));
    },
    [],
  );

  // Update columns when notes change
  useEffect(() => {
    // Group notes by status
    const draftNotes = notes.filter(note => note.status === "draft");
    const scheduledNotes = notes.filter(note => note.status === "scheduled");
    const publishedNotes = notes.filter(note => note.status === "published");
    const archivedNotes = notes.filter(note => note.isArchived);

    setColumns([
      {
        id: "draft",
        title: "Draft",
        items: convertToStatusItems(draftNotes),
        color: "gray",
        icon: FileText,
      },
      {
        id: "scheduled",
        title: "Scheduled",
        items: convertToStatusItems(scheduledNotes),
        color: "amber",
        icon: Clock,
      },
      {
        id: "published",
        title: "Published",
        items: convertToStatusItems(publishedNotes),
        color: "green",
        icon: CheckCircle,
      },
      {
        id: "archived",
        title: "Archived",
        items: convertToStatusItems(archivedNotes),
        color: "bg-gray-500",
        icon: Archive,
      },
    ]);
  }, [notes, convertToStatusItems]);

  // Handle status change
  const handleStatusChange = useCallback(
    async (
      item: StatusItem,
      newStatus: UniqueIdentifier,
      previousStatus: UniqueIdentifier | null,
    ) => {
      if (isUpdating) return;

      console.log("Status change requested:", item.id, "to", newStatus);

      try {
        setIsUpdating(true);

        // Find the note by id
        const note = notes.find(n => n.id === item.id);
        if (!note) {
          console.error("Note not found:", item.id);
          toast.error("Note not found");
          return;
        }

        // Update the note status
        await updateNoteStatus(note.id, newStatus as NoteStatus);
        if (previousStatus === "scheduled") {
          toast.info("Schedule was canceled");
        }
      } catch (error) {
        console.error("Error updating note status:", error);
        toast.error("Failed to update note status");
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [notes, updateNoteStatus, isUpdating],
  );

  return (
    <StatusBoard
      initialColumns={columns}
      selectedItem={selectedNote?.id}
      onStatusChange={handleStatusChange}
      onSelectItem={(itemId: UniqueIdentifier, showModal?: boolean) => {
        selectNote(itemId.toString(), {
          forceShowEditor: true,
          showScheduleModal: showModal,
        });
      }}
      onNewItem={async (status: UniqueIdentifier) => {
        await createDraftNote({ status: status as NoteStatus });
      }}
      hideArchiveColumn={true}
      className="min-h-[600px]"
      debug={true}
    />
  );
}
