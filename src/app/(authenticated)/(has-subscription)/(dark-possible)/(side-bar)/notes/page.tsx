"use client";

import { useEffect, useState } from "react";
import { useNotes } from "@/lib/hooks/useNotes";
import { Skeleton } from "@/components/ui/skeleton";
import NoteComponent from "@/components/ui/note-component";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const {
    fetchNotes,
    userNotes,
    loadingNotes,
    generateNewNotes,
    createDraftNote,
  } = useNotes();
  const [loadingCreateNote, setLoadingCreateNote] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    if (loadingCreateNote) return;
    setLoadingCreateNote(true);
    try {
      await generateNewNotes();
    } catch (error) {
      toast.error("Failed to create note");
    } finally {
      setLoadingCreateNote(false);
    }
  };

  const handleCreateDraftNote = async () => {
    if (loadingCreateNote) return;
    setLoadingCreateNote(true);
    try {
      await createDraftNote();
    } catch (error) {
      toast.error("Failed to create note");
    } finally {
      setLoadingCreateNote(false);
    }
  };

  if (loadingNotes && userNotes.length === 0) {
    return (
      <div className="container py-2 md:py-6 pb-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Notes</h1>
          <Button
            onClick={handleCreateDraftNote}
            disabled={loadingCreateNote}
            className={cn("flex items-center gap-2", {
              hidden: userNotes.length === 0,
            })}
          >
            {loadingCreateNote ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            New draft
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-transparent py-8 pb-28 md:py-16 flex justify-center items-start">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Notes</h1>
          <Button
            variant="neumorphic-primary"
            onClick={handleCreateDraftNote}
            disabled={loadingCreateNote}
            className={cn("flex items-center gap-2", {
              hidden: userNotes.length === 0,
            })}
          >
            {loadingCreateNote ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            New draft
          </Button>
        </div>

        {userNotes.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-medium mb-4 text-foreground">
              No notes found
            </h3>
            <p className="text-muted-foreground mb-8">
              Generate your first notes to get started!
            </p>
            <Button
              variant="neumorphic-primary"
              onClick={handleCreateNote}
              disabled={loadingCreateNote}
            >
              {loadingCreateNote && (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              )}
              Generate notes (3 credits)
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userNotes.map(note => (
              <NoteComponent key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
