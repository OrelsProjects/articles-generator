"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Copy, Image as ImageIcon, Undo, Redo } from "lucide-react";
import { selectNotes } from "@/lib/features/notes/notesSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import { TooltipButton } from "@/components/ui/tooltip-button";
import {
  formatText,
  loadContent,
  notesTextEditorOptions,
  unformatText,
} from "@/lib/utils/text-editor";
import { useEditor } from "@tiptap/react";
import NoteEditor from "@/components/notes/note-editor";
import { MAX_ATTACHMENTS, useNotes } from "@/lib/hooks/useNotes";
import { toast } from "react-toastify";
import {
  convertMDToHtml,
  isEmptyNote,
  NoteDraft,
  NoteDraftImage,
} from "@/types/note";
import { getScheduleTimeText } from "@/lib/utils/date/schedule";
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
import { cn } from "@/lib/utils";
import ScheduleNoteModal from "@/components/notes/schedule-note-modal";
import { Logger } from "@/logger";
import { MAX_FILE_SIZE } from "@/lib/consts";
import { EventTracker } from "@/eventTracker";
import { CharacterCountBar } from "@/components/notes/character-count-bar";
import { isPlagiarism } from "@/lib/utils/note-editor-utils";

export function NotesEditorDialog({ free = false }: { free?: boolean }) {
  const { user } = useAppSelector(selectAuth);
  const { selectedNote, thumbnail } = useAppSelector(selectNotes);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    updateNoteBody,
    editNoteBody,
    selectNote,
    loadingEditNote,
    updateNoteStatus,
    uploadingFilesCount: hookUploadingFilesCount,
    uploadFile,
    deleteImage,
    scheduleNote,
    cancelUpdateNoteBody,
    loadingScheduleNote,
  } = useNotes();

  const editor = useEditor(
    notesTextEditorOptions(html => {
      // Update character count
      const textContent = editor?.getText() || "";
      setCharacterCount(textContent.length);

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
  const [uploadingFilesCount, setUploadingFilesCount] = useState(0);
  const [isSendingNote, setIsSendingNote] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  // State for drag and drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const isInspiration = selectedNote?.status === "inspiration";
  const isAiGenerated = selectedNote?.status === "chat-generated";
  const isEmpty = isEmptyNote(selectedNote);

  const updateEditorBody = (body: string) => {
    convertMDToHtml(body).then(html => {
      loadContent(html, editor);
      // Update character count after setting content
      setTimeout(() => {
        const textContent = editor?.getText() || "";
        setCharacterCount(textContent.length);
      }, 0);
    });
  };

  const canUploadImages = useMemo(() => {
    return (selectedNote?.attachments?.length || 0) < MAX_ATTACHMENTS;
  }, [selectedNote?.attachments?.length]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Reset for next use -
      updateEditorBody("");
      selectNote(null);
      cancelUpdateNoteBody(selectedNote?.id || "");
    } else {
      cancelUpdateNoteBody(selectedNote?.id || "", false);
      loadContent(selectedNote?.body || "", editor);
    }
  };

  useEffect(() => {
    const handlePasteImage = async (e: CustomEvent<File>) => {
      if (!canUploadImages) return;
      const file = e.detail;
      if (file) {
        await handleImageSelect([file]);
      }
    };

    window.addEventListener(
      "editor-image-paste",
      handlePasteImage as unknown as EventListener,
    );

    return () => {
      window.removeEventListener(
        "editor-image-paste",
        handlePasteImage as unknown as EventListener,
      );
    };
  }, [selectedNote, canUploadImages]);

  useEffect(() => {
    setUploadingFilesCount(hookUploadingFilesCount);
  }, [hookUploadingFilesCount]);

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
    return user?.displayName || name;
  }, [user?.displayName, name]);

  const noteThumbnail = useMemo(() => {
    return thumbnail;
  }, [thumbnail]);

  const inspirationAuthorName = useMemo(() => {
    if (isInspiration) {
      return selectedNote.authorName || selectedNote.handle;
    }
    return null;
  }, [isInspiration, selectedNote?.name, selectedNote?.handle]);

  const inspirationThumbnail = useMemo(() => {
    if (isInspiration) {
      return selectedNote.thumbnail;
    }
    return null;
  }, [isInspiration, selectedNote?.thumbnail]);

  const userInitials = useMemo(() => {
    let writerName = name || user?.displayName || "";
    if (!writerName) return "OZ";
    return (
      writerName
        ?.split(" ")
        .map(name => name[0])
        .join("") || "OZ"
    );
  }, [name, user?.displayName]);

  async function handleBodyChange(
    html: string,
    options?: { immediate?: boolean },
  ): Promise<NoteDraft | null> {
    if(!editor) return null;
    const newBody = unformatText(html);
    const json = editor.getJSON();
    if (selectedNote) {
      if (options?.immediate) {
        const note = await editNoteBody(selectedNote.id, newBody, json);
        return note;
      } else {
        updateNoteBody(selectedNote.id, newBody, json);
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
    if (
      isPlagiarism(
        editor?.getHTML() || "",
        selectedNote,
        user?.meta?.author?.id || null,
      )
    ) {
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
              toast.update(toastId, {
                render: "Uploading image...",
                isLoading: true,
              });
              const attachments = currentNote.attachments?.filter(
                attachment => !!attachment.url,
              );
              const files = await Promise.all(
                attachments.map(attachment => urlToFile(attachment.url)),
              );
              const validFiles = files.filter(file => !!file);
              if (validFiles.length > 0) {
                await uploadFile(validFiles, note.id);
              }
              toast.dismiss(toastId);
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
        Logger.info("ADDING-SCHEDULE: handleSave", {
          newNote,
          scheduledTo,
        });
        try {
          toast.update(toastId, {
            render: "Scheduling note...",
            isLoading: true,
          });
          await scheduleNote(newNote, scheduledTo, {
            showToast: true,
          });
          handleOpenChange(false);
          toast.success(
            "Note scheduled to: " + getScheduleTimeText(scheduledTo, false),
            {
              autoClose: 6000,
            },
          );
        } catch (e: any) {
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
    loadContent(formattedText, editor);
    editor?.commands.focus();
  };

  const handleEmojiSelect = (emoji: Skin) => {
    editor?.chain().focus().insertContent(emoji.native).run();
  };

  const handleCopy = async () => {
    EventTracker.track("note_editor_dialog_copy");
    const html = editor?.getHTML();
    if (!html) {
      toast.error("No content to copy");
      return;
    }
    await copyHTMLToClipboard(html);
    toast.success("Copied to clipboard");
  };

  const validateFileSize = (files: File[]) => {
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.info(
        `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
      return false;
    }
    return true;
  };

  const handleFileUpload = async (files: File[]) => {
    if (!selectedNote) return;
    if (!validateFileSize(files)) return;
    try {
      let noteId = selectedNote.id;
      if (isEmpty) {
        const note = await handleCreateNewDraft();
        if (note) {
          noteId = note.id;
        }
      }
      if (noteId) {
        await uploadFile(files, noteId);
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  // Handle file upload when an image is dropped
  const handleFileDrop = async (files: File[]) => {
    EventTracker.track("note_editor_dialog_file_drop");
    if (!selectedNote) return;
    if (!validateFileSize(files)) {
      setIsDraggingOver(false);
      return;
    }

    // Check if there's already an image
    if (
      selectedNote.attachments &&
      selectedNote.attachments.length >= MAX_ATTACHMENTS
    ) {
      setIsDraggingOver(false);
      toast.info(`Only ${MAX_ATTACHMENTS} images allowed`);
      return;
    }

    setIsDraggingOver(false);
    try {
      await handleFileUpload(files);
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

  const handleImageSelect = async (files: File[]) => {
    if (!selectedNote) return;
    if (!validateFileSize(files)) return;

    // Check if there's already an image
    if (selectedNote.attachments && selectedNote.attachments.length > 0) {
      toast.info(`Only ${MAX_ATTACHMENTS} images allowed`);
      return;
    }

    try {
      await handleFileUpload(files);
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
      !isInspiration &&
      !isAiGenerated
    );
  }, [
    loadingEditNote,
    loadingScheduleNote,
    isSendingNote,
    isInspiration,
    isAiGenerated,
  ]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          hideCloseButton
          backgroundBlur={false}
          className="sm:min-w-[600px] sm:min-h-[290px] max-w-[600px] p-0 gap-0 border-border bg-background rounded-2xl"
        >
          <div className="relative overflow-visible">
            <div
              className="flex flex-col w-full relative z-20 bg-background rounded-2xl h-[99%]"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <ImageDropOverlay
                isVisible={isDraggingOver}
                onFileDrop={handleFileDrop}
                disabled={!canUploadImages}
                onHide={() => setIsDraggingOver(false)}
                maxAttachments={MAX_ATTACHMENTS}
              />

              <div className="flex items-start p-4 gap-3 z-20">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage
                    src={noteThumbnail || user?.image || ""}
                    alt="User"
                  />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col">
                      <h3 className="font-medium text-foreground">
                        {noteAuthorName || userName}
                      </h3>
                      {isInspiration && inspirationAuthorName && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <span>(Inspired by:</span>
                          {inspirationThumbnail && (
                            <img
                              src={inspirationThumbnail}
                              alt={inspirationAuthorName}
                              className="w-4 h-4 rounded-full"
                            />
                          )}
                          <span>{inspirationAuthorName})</span>
                        </div>
                      )}
                    </div>
                    {/* <div className="max-w-xs">
                      <CharacterCountBar
                        characterCount={characterCount}
                        className="text-right"
                      />
                    </div> */}
                  </div>
                  {editor && (
                    <NoteEditor
                      editor={editor}
                      onSave={() => handleSave({ closeOnSave: false })}
                      className="w-full h-full"
                      textEditorClassName="!px-0"
                    />
                  )}
                  {selectedNote?.attachments &&
                    selectedNote.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedNote.attachments.map(attachment => (
                          <NoteImageContainer
                            key={attachment.id || attachment.url}
                            imageUrl={attachment.url}
                            onImageSelect={handleImageSelect}
                            onImageDelete={handleImageDelete}
                            attachment={attachment}
                            allowDelete={!isInspiration && attachment.id !== ""}
                          />
                        ))}
                      </div>
                    )}
                  {uploadingFilesCount > 0 && (
                    <div className="max-md:max-h-[96px] max-md:overflow-x-auto max-md:max-w-[260px]">
                      <div className="flex flex-row md:flex-wrap gap-2">
                        {Array.from({ length: uploadingFilesCount }).map(
                          (_, index) => (
                            <Skeleton
                              key={index}
                              className="md:w-[180px] md:h-[96px] w-[108px] h-[60px] rounded-md flex-shrink-0"
                            />
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "flex flex-col md:flex-row items-center justify-between p-4 border-t border-border gap-4 md:gap-0 z-20",
                  {
                    "justify-between": isInspiration,
                  },
                  { "justify-between": free },
                )}
              >
                <div className={cn("h-full flex gap-2 items-center")}>
                  <TooltipButton
                    tooltipContent="Undo"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 md:hidden"
                    onClick={() => {
                      EventTracker.track("note_editor_dialog_undo");
                      editor?.chain().focus().undo().run();
                    }}
                    disabled={!editor?.can().undo()}
                  >
                    <Undo className="h-5 w-5 text-muted-foreground" />
                  </TooltipButton>
                  <TooltipButton
                    tooltipContent="Redo"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 md:hidden"
                    onClick={() => {
                      EventTracker.track("note_editor_dialog_redo");
                      editor?.chain().focus().redo().run();
                    }}
                    disabled={!editor?.can().redo()}
                  >
                    <Redo className="h-5 w-5 text-muted-foreground" />
                  </TooltipButton>
                  {!free && (
                    <AIToolsDropdown
                      note={selectedNote}
                      onImprovement={handleImprovement}
                    />
                  )}
                  <EmojiPopover onEmojiSelect={handleEmojiSelect} />
                  <TooltipButton
                    tooltipContent={
                      selectedNote?.attachments?.length
                        ? `Only ${MAX_ATTACHMENTS} images allowed`
                        : "Add image"
                    }
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={!canUploadImages}
                    onClick={() => {
                      EventTracker.track("note_editor_dialog_add_image");
                      fileInputRef.current?.click();
                    }}
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </TooltipButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        handleImageSelect(files);
                      }
                      e.target.value = "";
                    }}
                    disabled={!canUploadImages}
                  />
                  <TooltipButton
                    tooltipContent="Copy"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex"
                    onClick={handleCopy}
                  >
                    <Copy className="h-5 w-5 text-muted-foreground" />
                  </TooltipButton>
                </div>
                <div className="flex gap-3">
                  {!isInspiration && !free && (
                    <InstantPostButton
                      onSave={() => handleSave({ closeOnSave: false })}
                      noteId={selectedNote?.id || null}
                      source="note-editor-dialog"
                      onLoadingChange={setIsSendingNote}
                      disabled={!canSendNote}
                      onNoteSent={() => {
                        handleOpenChange(false);
                      }}
                    />
                  )}
                  {
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
                      isAiGenerated={isAiGenerated}
                      isFree={free}
                    />
                  }
                </div>
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
