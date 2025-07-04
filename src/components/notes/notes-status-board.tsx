"use client";

import { useState, useCallback, useEffect } from "react";
import { StatusBoard } from "@/components/ui/status-board/status-board";
import { StatusColumn, StatusItem } from "@/components/ui/status-board/types";
import { NoteDraft, NoteStatus } from "@/types/note";
import { useNotes } from "@/lib/hooks/useNotes";
import { toast } from "react-toastify";
import { UniqueIdentifier } from "@dnd-kit/core";
import { FileText, Clock, CheckCircle, Archive } from "lucide-react";
import { Logger } from "@/logger";
import { Skeleton } from "@/components/ui/skeleton";
import KanbanLoading from "@/components/loading/kanban-loading";

export interface NotesStatusBoardProps {
  notes: NoteDraft[];
  loading: boolean;
}


export function NotesStatusBoard({ notes, loading }: NotesStatusBoardProps) {
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
        hasAttachment: (note.attachments?.length || 0) > 0,
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
        // order by scheduledTo date. asc
        orderFunction: (item: StatusItem) => {
          return new Date(item.noteDraft?.scheduledTo || "").getTime();
        },
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

      Logger.info("Status change requested:", {
        itemId: item.id,
        newStatus,
        previousStatus,
      });

      try {
        setIsUpdating(true);

        // Find the note by id
        const note = notes.find(n => n.id === item.id);
        if (!note) {
          Logger.error("Note not found:", {
            itemId: item.id,
          });
          toast.error("Note not found");
          return;
        }

        // Update the note status
        await updateNoteStatus(note.id, newStatus as NoteStatus);
        if (previousStatus === "scheduled") {
          toast.info("Schedule was canceled");
        }
      } catch (error) {
        Logger.error("Error updating note status:", {
          error: JSON.stringify(error),
        });
        toast.error("Failed to update note status");
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [notes, updateNoteStatus, isUpdating],
  );

  if (loading) {
    return <KanbanLoading />;
  }

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
