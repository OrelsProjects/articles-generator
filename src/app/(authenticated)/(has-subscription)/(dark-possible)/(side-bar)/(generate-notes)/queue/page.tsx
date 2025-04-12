"use client";

import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import QueuePage from "@/components/queue/queue-page";
import { useQueue } from "@/lib/hooks/useQueue";
import { Loader2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useNotes } from "@/lib/hooks/useNotes";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { NoteDraft } from "@/types/note";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";

export default function NotesCalendarPage() {
  const router = useCustomRouter();
  const pathname = usePathname();
  const { getNoteByNoteId, selectNote, sendNote } = useNotes();
  const searchParams = useSearchParams();
  const { loading, error } = useNotesSchedule();
  const sendNoteId = searchParams.get("sendNoteId");
  const isSendingNote = useRef(false);

  useEffect(() => {
    
    if (sendNoteId && !isSendingNote.current) {
      isSendingNote.current = true;
      getNoteByNoteId(sendNoteId)
        .then((note: NoteDraft | null) => {
          if (note) {
            selectNote(note);
            const toastId = toast.loading(
              "Posting note...(Don't click anything)",
            );
            sendNote(note.id)
              .then(() => {
                toast.update(toastId, {
                  render: "Note posted successfully!",
                  type: "success",
                  isLoading: false,
                  autoClose: 3000,
                });
                selectNote(null);
              })
              .catch(() => {
                toast.update(toastId, {
                  render: "Failed to send note",
                  type: "error",
                  autoClose: 3000,
                  isLoading: false,
                });
              });
          }
        })
        .catch(() => {
          toast.error("Failed to send note");
        })
        .finally(() => {
          router.push(pathname, {
            paramsToRemove: ["sendNoteId"],
          });
        });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-screen md:container mx-auto">
      <QueuePage />
    </div>
  );
}
