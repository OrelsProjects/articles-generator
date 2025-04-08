"use client";

import { useEffect, useState } from "react";
import { useNotes } from "@/lib/hooks/useNotes";
import { Skeleton } from "@/components/ui/skeleton";
import NoteComponent from "@/components/ui/note-component";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useExtension } from "@/lib/hooks/useExtension";
import { useSearchParams } from "next/navigation";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { NoteDraft, NoteStatus } from "@/types/note";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { GenerateNotesDialog } from "@/components/notes/generate-notes-dialog";

export default function NotesPage() {
  const router = useCustomRouter();
  const {
    fetchNotes,
    userNotes,
    loadingNotes,
    generateNewNotes,
    createDraftNote,
    isLoadingGenerateNotes,
    errorGenerateNotes,
    getNoteByNoteId,
    selectNote,
  } = useNotes();

  const searchParams = useSearchParams();
  const sendNoteId = searchParams.get("sendNoteId");
  const [activeTab, setActiveTab] = useState<NoteStatus>("draft");

  const { sendNote } = useExtension();

  useEffect(() => {
    if (sendNoteId) {
      getNoteByNoteId(sendNoteId)
        .then((note: NoteDraft | null) => {
          if (note) {
            selectNote(note);
            const toastId = toast.loading(
              "Posting note...(Don't click anything)",
            );
            sendNote({
              message: note.body,
              moveNoteToPublished: {
                noteId: note.id,
              },
            })
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
          router.push("/notes", {
            paramsToRemove: ["sendNoteId"],
          });
        });
    }
    fetchNotes();
  }, []);

  useEffect(() => {
    if (errorGenerateNotes) {
      toast.error(errorGenerateNotes);
    }
  }, [errorGenerateNotes]);

  const handleCreateNote = async () => {
    if (isLoadingGenerateNotes) return;
    try {
      await generateNewNotes();
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  const handleCreateDraftNote = async () => {
    if (isLoadingGenerateNotes) return;
    try {
      await createDraftNote();
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  // Filter notes based on active tab
  const filteredNotes = userNotes.filter(note => note.status === activeTab);

  // Count notes by status
  const noteCountsByStatus = {
    scheduled: userNotes.filter(note => note.status === "scheduled").length,
    draft: userNotes.filter(note => note.status === "draft").length,
    published: userNotes.filter(note => note.status === "published").length,
    failed: userNotes.filter(note => note.status === "failed").length,
    archived: userNotes.filter(note => note.isArchived).length,
  };

  if (loadingNotes && userNotes.length === 0) {
    return (
      <div className="w-full min-h-screen bg-transparent py-8 pb-28 md:py-16 flex justify-center items-start">
        <div className="container py-2 md:py-6 pb-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Notes</h1>
            <Button
              onClick={handleCreateDraftNote}
              disabled={isLoadingGenerateNotes}
              className={cn("flex items-center gap-2", {
                hidden: userNotes.length === 0,
              })}
            >
              {isLoadingGenerateNotes ? (
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
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-transparent pb-28 md:py-16 flex justify-center items-start">
      <div className="container mx-auto py-8">
        <div className="border-b pb-4">
          <div className="md:container">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">Notes</h1>
              <TooltipButton
                tooltipContent="Start writing"
                variant="outline"
                onClick={handleCreateDraftNote}
                disabled={isLoadingGenerateNotes}
                className="flex md:hidden items-center gap-2"
              >
                <Plus size={16} />
                New draft
              </TooltipButton>
            </div>
            <div className="flex justify-between items-center">
              <Tabs
                defaultValue="draft"
                value={activeTab}
                onValueChange={value => setActiveTab(value as NoteStatus)}
                className="w-full overflow-x-auto"
              >
                <TabsList className="bg-transparent p-0 space-x-6">
                  <TabsTrigger value="draft" className="rounded-none px-0 py-2">
                    Drafts ({noteCountsByStatus.draft})
                  </TabsTrigger>
                  <TabsTrigger
                    value="scheduled"
                    className="rounded-none px-0 py-2"
                  >
                    Scheduled ({noteCountsByStatus.scheduled})
                  </TabsTrigger>
                  <TabsTrigger
                    value="published"
                    className="rounded-none px-0 py-2"
                  >
                    Posted ({noteCountsByStatus.published})
                  </TabsTrigger>
                  <TabsTrigger
                    value="failed"
                    className="rounded-none px-0 py-2"
                  >
                    Failed ({noteCountsByStatus.failed})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex justify-end items-center gap-2">
                <TooltipButton
                  tooltipContent="Start writing"
                  variant="outline"
                  onClick={handleCreateDraftNote}
                  disabled={isLoadingGenerateNotes}
                  className="hidden md:flex items-center gap-2"
                >
                  <Plus size={16} />
                  New draft
                </TooltipButton>
                <GenerateNotesDialog />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 py-8 pb-0 md:pb-28">
          <div className="md:container">
            {userNotes.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-2xl font-medium mb-4 text-foreground">
                  No notes found
                </h3>
                <p className="text-muted-foreground mb-8">
                  Generate your first notes to get started!
                </p>
                <GenerateNotesDialog />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-2xl font-medium mb-4 text-foreground">
                  No {activeTab} notes found
                </h3>
                {activeTab === "draft" && (
                  <Button
                    variant="neumorphic-primary"
                    onClick={handleCreateDraftNote}
                    disabled={isLoadingGenerateNotes}
                  >
                    {isLoadingGenerateNotes && (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Create new draft
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map(note => (
                  <NoteComponent key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
