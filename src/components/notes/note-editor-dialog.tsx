"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Copy, Image as ImageIcon } from "lucide-react";
import { selectNotes } from "@/lib/features/notes/notesSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import { TooltipButton } from "@/components/ui/tooltip-button";
import {
  formatText,
  notesTextEditorOptions,
  unformatText,
} from "@/lib/utils/text-editor";
import { useEditor } from "@tiptap/react";
import NoteEditor from "@/components/notes/note-editor";
import { useNotes } from "@/lib/hooks/useNotes";
import { toast } from "react-toastify";
import {
  convertMDToHtml,
  isEmptyNote,
  NoteDraft,
  NoteDraftImage,
} from "@/types/note";
import { getScheduleTimeText } from "@/lib/utils/date/schedule";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { InstantPostButton } from "@/components/notes/instant-post-button";
import EmojiPopover from "@/components/notes/emoji-popover";
import { Skin } from "@emoji-mart/data";
import { copyHTMLToClipboard } from "@/lib/utils/copy";
import { selectAuth } from "@/lib/features/auth/authSlice";
import ImageDropOverlay from "@/components/notes/image-drop-overlay";
import { NoteImageContainer } from "@/components/notes/note-image-container";
import { Skeleton } from "@/components/ui/skeleton";
import { AIToolsDropdown } from "@/components/notes/ai-tools-dropdown";
import { CancelError } from "@/types/errors/CancelError";
import { urlToFile } from "@/lib/utils/file";
import { SaveDropdown } from "@/components/notes/save-dropdown";
import { AvoidPlagiarismDialog } from "@/components/notes/avoid-plagiarism-dialog";
import slugify from "slugify";
import { ScheduleFailedEmptyNoteBodyError } from "@/types/errors/ScheduleFailedEmptyNoteBodyError";
import { cn } from "@/lib/utils";
import ScheduleNoteModal from "@/components/notes/schedule-note-modal";
import { ScheduleLimitExceededError } from "@/types/errors/ScheduleLimitExceededError";

export function NotesEditorDialog() {
  const { user } = useAppSelector(selectAuth);
  const { selectedNote, thumbnail, handle } = useAppSelector(selectNotes);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    updateNoteBody,
    editNoteBody,
    selectNote,
    loadingEditNote,
    updateNoteStatus,
    uploadingFile,
    uploadFile,
    deleteImage,
    cancelUpdateNoteBody,
  } = useNotes();

  const { scheduleNote, loadingScheduleNote } = useNotesSchedule();

  const editor = useEditor(
    notesTextEditorOptions(html => {
      if (isInspiration) {
        return;
      }
      return handleBodyChange(html);
    }),
  );

  const [showAvoidPlagiarismDialog, setShowAvoidPlagiarismDialog] =
    useState(false);
  // setOpen MUST be called only from handleOpenChange to avoid logic bugs, like setting body to ''.
  const [open, setOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined,
  );
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSendingNote, setIsSendingNote] = useState(false);

  // State for drag and drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const isInspiration = selectedNote?.status === "inspiration";
  const isEmpty = isEmptyNote(selectedNote);

  const updateEditorBody = (body: string) => {
    convertMDToHtml(body).then(html => {
      editor?.commands.setContent(html);
    });
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Reset for next use -
      updateEditorBody("");
      selectNote(null);
      cancelUpdateNoteBody(selectedNote?.id || "");
    } else {
      cancelUpdateNoteBody(selectedNote?.id || "", false);
    }
  };

  useEffect(() => {
    setIsUploadingFile(uploadingFile);
  }, [uploadingFile]);

  useEffect(() => {
    if (!editor) return;
    // We check for body empty because selectedNote will change on update and we don't want the cursor the jump around after the update.
    // So we use body as our source of truth.
    if (selectedNote && !editor?.getText()) {
      handleOpenChange(true);
      const isSelectedNoteBodyEmpty =
        !selectedNote?.body || selectedNote?.body === "";
      if (isSelectedNoteBodyEmpty && !isInspiration) {
        updateEditorBody("");
      } else {
        updateEditorBody(selectedNote.body);
      }
      if (selectedNote.scheduledTo) {
        const presetDate = new Date(selectedNote.scheduledTo);
        setScheduledDate(presetDate);
      } else {
        setScheduledDate(undefined);
      }
    }
  }, [selectedNote, editor]);

  const name = useMemo(() => {
    if (!selectedNote) return "";
    return selectedNote.authorName;
  }, [selectedNote]);

  const noteAuthorName = useMemo(() => {
    if (isInspiration) {
      return selectedNote.name || selectedNote.handle;
    }
    return name;
  }, [isInspiration, selectedNote?.handle, name]);

  const noteThumbnail = useMemo(() => {
    if (isInspiration) {
      return selectedNote.thumbnail;
    }
    return thumbnail;
  }, [isInspiration, selectedNote?.thumbnail, thumbnail]);

  const userInitials = useMemo(() => {
    let writerName = name || user?.displayName || "";
    if (!writerName) return "OZ";
    return (
      writerName
        ?.split(" ")
        .map(name => name[0])
        .join("") || "OZ"
    );
  }, [name]);

  async function handleBodyChange(
    html: string,
    options?: { immediate?: boolean },
  ): Promise<NoteDraft | null> {
    const newBody = unformatText(html);
    if (selectedNote) {
      if (options?.immediate) {
        const note = await editNoteBody(selectedNote.id, newBody);
        return note;
      } else {
        updateNoteBody(selectedNote.id, newBody);
        return null;
      }
    }
    return null;
  }

  const handleCreateNewDraft = async (): Promise<NoteDraft | null> => {
    const html = editor?.getHTML();
    if (!html) return null;
    const note = await handleBodyChange(html, { immediate: true });
    return note;
  };

  const userName = useMemo(() => {
    return name || user?.displayName || "Unknown";
  }, [name]);

  const isPlagiarism = () => {
    const unformattedBody = unformatText(editor?.getHTML() || "");
    const unformattedNoteBody = unformatText(selectedNote?.body || "");

    const slugifiedBody = slugify(unformattedBody, {
      lower: true,
      strict: true,
    });
    const slugifiedNoteBody = slugify(unformattedNoteBody, {
      lower: true,
      strict: true,
    });

    return (
      slugifiedBody === slugifiedNoteBody &&
      selectedNote?.status === "inspiration" &&
      selectedNote?.handle !== handle
    );
  };
  const handleSave = async (
    options: {
      schedule?: {
        to: Date;
      };
      closeOnSave?: boolean;
    } = {
      closeOnSave: true,
    },
  ): Promise<string | null> => {
    if (!selectedNote) return null;
    if (isPlagiarism()) {
      setShowAvoidPlagiarismDialog(true);
      return null;
    }

    const toastId = toast.loading("Saving note...");
    try {
      const currentNote = { ...selectedNote };
      const { schedule, closeOnSave } = options || {};
      const scheduledTo = schedule?.to;
      const shouldSchedule = !!scheduledTo;

      let newNote = {
        ...currentNote,
        scheduledTo,
      };

      try {
        const note = await handleBodyChange(editor?.getHTML() || "", {
          immediate: true,
        });
        if (note) {
          if (currentNote.status === "inspiration") {
            if (currentNote.attachments && currentNote.attachments.length > 0) {
              const url = currentNote.attachments?.[0].url;
              if (url) {
                toast.update(toastId, {
                  render: "Uploading image...",
                  isLoading: true,
                });
                setIsUploadingFile(true);
                const file = await urlToFile(url);
                await uploadFile(file, note.id);
              }
            }
          }
          newNote = {
            ...newNote,
            ...note,
            scheduledTo,
          };
        }
      } catch (e: any) {
        if (e instanceof CancelError) {
          return null;
        }
        toast.error("Failed to save note");
        return null;
      }
      if (shouldSchedule) {
        try {
          toast.update(toastId, {
            render: "Scheduling note...",
            isLoading: true,
          });
          await scheduleNote(newNote);
          handleOpenChange(false);
          toast.success(
            "Note scheduled to: " + getScheduleTimeText(scheduledTo, false),
            {
              autoClose: 6000,
            },
          );
        } catch (e: any) {
          if (e instanceof CancelError) {
            return null;
          }
          if (e instanceof ScheduleFailedEmptyNoteBodyError) {
            toast.error("Note body is empty");
            return null;
          } else if (e instanceof ScheduleLimitExceededError) {
            toast.error(
              "You have reached the maximum number of scheduled notes",
            );
            return null;
          } else {
            toast.error("Failed to schedule note. Try again please.", {
              autoClose: 2000,
            });
          }
          return null;
        }
      } else if (selectedNote?.status === "scheduled") {
        try {
          toast.update(toastId, {
            render: "Unscheduling note...",
            isLoading: true,
          });
          await updateNoteStatus(selectedNote.id, "draft");
          toast.info("Note unscheduled");
          handleOpenChange(false);
        } catch (e: any) {
          if (e instanceof CancelError) {
            return null;
          }
          toast.error("Failed to unschedule note");
          return null;
        }
      }
      if (closeOnSave) {
        handleOpenChange(false);
      }
      return isEmptyNote(newNote) ? null : newNote.id;
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleImprovement = (improvedText: string) => {
    const formattedText = formatText(improvedText);
    updateEditorBody(formattedText);
    editor?.commands.focus();
  };

  const handleEmojiSelect = (emoji: Skin) => {
    editor?.chain().focus().insertContent(emoji.native).run();
  };

  const handleCopy = async () => {
    const html = editor?.getHTML();
    if (!html) {
      toast.error("No content to copy");
      return;
    }
    await copyHTMLToClipboard(html);
    toast.success("Copied to clipboard");
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedNote) return;
    try {
      let noteId = selectedNote.id;
      if (isEmpty) {
        const note = await handleCreateNewDraft();
        if (note) {
          noteId = note.id;
        }
      }
      if (noteId) {
        await uploadFile(file, noteId);
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  // Handle file upload when an image is dropped
  const handleFileDrop = async (file: File) => {
    if (!selectedNote) return;

    // Check if there's already an image
    if (selectedNote.attachments && selectedNote.attachments.length > 0) {
      setIsDraggingOver(false);
      toast.error("Only one image is allowed");
      return;
    }

    try {
      setIsDraggingOver(false);
      await handleFileUpload(file);
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if files are being dragged
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if the drag leave is from the editor area
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    setIsDraggingOver(false);
  }, []);

  const handleImageSelect = async (file: File) => {
    if (!selectedNote) return;

    // Check if there's already an image
    if (selectedNote.attachments && selectedNote.attachments.length > 0) {
      toast.error("Only one image is allowed");
      return;
    }

    try {
      await handleFileUpload(file);
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  const handleImageDelete = useCallback(
    async (attachment: NoteDraftImage) => {
      if (!selectedNote) return;

      try {
        await deleteImage(selectedNote.id, attachment);
      } catch (error) {
        toast.error("Failed to delete image");
        console.error(error);
      }
    },
    [selectedNote],
  );

  const canSendNote = useMemo(() => {
    return (
      !loadingEditNote &&
      !loadingScheduleNote &&
      !isSendingNote &&
      !isInspiration
    );
  }, [loadingEditNote, loadingScheduleNote, isSendingNote, isInspiration]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          hideCloseButton
          className="sm:min-w-[600px] sm:min-h-[290px] p-0 gap-0 border-border bg-background rounded-2xl"
        >
          <div
            className="flex flex-col w-full relative"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <ImageDropOverlay
              isVisible={isDraggingOver}
              onFileDrop={handleFileDrop}
              disabled={(selectedNote?.attachments?.length || 0) > 0}
              onHide={() => setIsDraggingOver(false)}
            />

            <div className="flex items-start p-4 gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarImage
                  src={noteThumbnail || user?.image || ""}
                  alt="User"
                />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">
                  {noteAuthorName || userName}
                </h3>
                {editor && (
                  <NoteEditor
                    editor={editor}
                    className="w-full h-full"
                    textEditorClassName="!px-0"
                  />
                )}
                {selectedNote?.attachments &&
                  selectedNote.attachments.length > 0 &&
                  !isUploadingFile && (
                    <div className="mt-4 mb-4 flex flex-wrap gap-2">
                      {selectedNote.attachments.map(attachment => (
                        <NoteImageContainer
                          key={attachment.id || attachment.url}
                          imageUrl={attachment.url}
                          onImageSelect={handleImageSelect}
                          onImageDelete={handleImageDelete}
                          attachment={attachment}
                          allowDelete={attachment.id !== ""}
                        />
                      ))}
                    </div>
                  )}
                {isUploadingFile && (
                  <Skeleton className="mt-4 mb-4 w-[180px] h-[96px] rounded-md" />
                )}
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col md:flex-row items-center justify-between p-4 border-t border-border gap-4 md:gap-0",
                {
                  "justify-end": isInspiration,
                },
              )}
            >
              <div
                className={cn("h-full flex gap-2 items-center", {
                  hidden: isInspiration,
                })}
              >
                <AIToolsDropdown
                  note={selectedNote}
                  onImprovement={handleImprovement}
                />
                <EmojiPopover onEmojiSelect={handleEmojiSelect} />
                <TooltipButton
                  tooltipContent={
                    selectedNote?.attachments?.length
                      ? "Only one image allowed"
                      : "Add image"
                  }
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={uploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </TooltipButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageSelect(file);
                    }
                    e.target.value = "";
                  }}
                  disabled={
                    uploadingFile ||
                    (selectedNote?.attachments?.length ?? 0) > 0
                  }
                />
                <TooltipButton
                  tooltipContent="Copy"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hidden md:flex"
                  onClick={handleCopy}
                >
                  <Copy className="h-5 w-5 text-muted-foreground" />
                </TooltipButton>
              </div>
              <div className="flex gap-3">
                {!isInspiration && (
                  <InstantPostButton
                    onSave={() => handleSave({ closeOnSave: false })}
                    noteId={selectedNote?.id || null}
                    source="note-editor-dialog"
                    onLoadingChange={setIsSendingNote}
                    disabled={!canSendNote}
                  />
                )}
                <SaveDropdown
                  onSave={({ closeOnSave }) => handleSave({ closeOnSave })}
                  onSchedule={() => {
                    setScheduleDialogOpen(true);
                  }}
                  onAddToQueue={(date: Date) => {
                    setScheduledDate(date);
                    return handleSave({
                      schedule: {
                        to: date,
                      },
                    });
                  }}
                  presetSchedule={scheduledDate}
                  disabled={
                    loadingEditNote || loadingScheduleNote || isSendingNote
                  }
                  saving={loadingEditNote}
                  isInspiration={isInspiration}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AvoidPlagiarismDialog
        open={showAvoidPlagiarismDialog}
        onOpenChange={setShowAvoidPlagiarismDialog}
        onConfirm={() => {
          setShowAvoidPlagiarismDialog(false);
        }}
      />
      <ScheduleNoteModal
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onScheduleConfirm={async (date: Date) => {
          return handleSave({
            schedule: {
              to: date,
            },
          });
        }}
      />
    </>
  );
}
