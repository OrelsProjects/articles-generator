"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, Copy, Image as ImageIcon } from "lucide-react";
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
  NOTE_EMPTY,
  NoteDraft,
  NoteDraftImage,
} from "@/types/note";
import { isScheduled, getScheduleTimeText } from "@/lib/utils/date/schedule";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { InstantPostButton } from "@/components/notes/instant-post-button";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import { NoSubstackCookiesError } from "@/types/errors/NoSubstackCookiesError";
import NoSubstackCookiesDialog from "@/components/notes/no-substack-cookies-dialog";
import EmojiPopover from "@/components/notes/emoji-popover";
import { Skin } from "@emoji-mart/data";
import { copyHTMLToClipboard } from "@/lib/utils/copy";
import { selectAuth } from "@/lib/features/auth/authSlice";
import ScheduleNote from "@/components/notes/schedule-note";
import ImageDropOverlay from "@/components/notes/image-drop-overlay";
import { NoteImageContainer } from "@/components/notes/note-image-container";
import { Skeleton } from "@/components/ui/skeleton";
import { AIToolsDropdown } from "@/components/notes/ai-tools-dropdown";
import { Button } from "@/components/ui/button";
import { CancelError } from "@/types/errors/CancelError";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { urlToFile } from "@/lib/utils/file";

export function NotesEditorDialog() {
  const { user } = useAppSelector(selectAuth);
  const { selectedNote, thumbnail } = useAppSelector(selectNotes);
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
  const {
    scheduleNote,
    loadingScheduleNote,
    initCanUserScheduleInterval,
    isIntervalRunning,
    cancelCanUserScheduleInterval,
  } = useNotesSchedule();

  const [lastNote, setLastNote] = useLocalStorage<NoteDraft | null>(
    "last_note",
    null,
  );
  const editor = useEditor(notesTextEditorOptions(handleBodyChange));

  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  // setOpen MUST be called only from handleOpenChange to avoid logic bugs, like setting body to ''.
  const [open, setOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined,
  );
  const [unscheduling, setUnscheduling] = useState(false);
  const [confirmedSchedule, setConfirmedSchedule] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSendingNote, setIsSendingNote] = useState(false);

  // State for drag and drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const isInspiration = selectedNote?.status === "inspiration";
  const isEmpty = isEmptyNote(selectedNote);

  const updateLastNote = (note: NoteDraft | null) => {
    // Only update the lastest if it's not saved in the db and if it's not an inspiration note.
    if (!isInspiration && (isEmpty || !note)) {
      setLastNote(note);
    }
  };

  const updateEditorBody = (body: string) => {
    convertMDToHtml(body).then(html => {
      editor?.commands.setContent(html);
    });
  };

  const getLastNote = () => {
    if (!isInspiration && isEmpty) {
      return lastNote;
    }
    return null;
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      if (!isInspiration) {
        if (!isEmpty) {
          updateLastNote(null);
        } else {
          updateLastNote({
            ...(selectedNote || NOTE_EMPTY),
            body: editor?.getText() || "",
          });
        }
      }
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
        const lastNote = getLastNote();
        if (lastNote) {
          updateEditorBody(lastNote.body);
        } else {
          updateEditorBody("");
        }
      } else {
        updateEditorBody(selectedNote.body);
      }
      if (selectedNote.status === "scheduled" && selectedNote.scheduledTo) {
        const presetDate = new Date(selectedNote.scheduledTo);
        setScheduledDate(presetDate);
        setConfirmedSchedule(true);
      } else {
        setConfirmedSchedule(false);
      }
    }
  }, [selectedNote, editor]);

  const name = useMemo(() => {
    if (!selectedNote) return "";
    return selectedNote.authorName;
  }, [selectedNote]);

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
    // updateEditorBody(newBody);
    if (isEmpty && !isInspiration) {
      const lastNote = getLastNote();
      if (!lastNote) {
        updateLastNote({
          ...NOTE_EMPTY,
          body: newBody,
        });
      } else {
        updateLastNote({
          ...lastNote,
          body: newBody,
        });
      }
    }

    if (selectedNote) {
      if (options?.immediate) {
        const note = await editNoteBody(selectedNote.id, newBody);
        return note;
      } else if (!isEmpty) {
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
    if (note) {
      updateLastNote(null);
    }
    return note;
  };

  const userName = useMemo(() => {
    return name || user?.displayName || "Unknown";
  }, [name]);

  const scheduleIsSet = isScheduled(scheduledDate) && confirmedSchedule;

  const handleClearSchedule = () => {
    setScheduledDate(undefined);
    setConfirmedSchedule(false);
  };

  const handleConfirmSchedule = async (date: Date) => {
    setScheduledDate(date);
    setConfirmedSchedule(true);
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    const currentSelectedNote = selectedNote;
    let newNote = {
      ...currentSelectedNote,
      scheduledTo: scheduledDate,
    };
    const shouldSchedule = scheduleIsSet && scheduledDate;
    try {
      const note = await handleBodyChange(editor?.getHTML() || "", {
        immediate: true,
      });
      if (note) {
        if (currentSelectedNote.status === "inspiration") {
          if (
            currentSelectedNote.attachments &&
            currentSelectedNote.attachments.length > 0
          ) {
            const url = currentSelectedNote.attachments?.[0].url;
            if (url) {
              setIsUploadingFile(true);
              const file = await urlToFile(url);
              await uploadFile(file, note.id);
            }
          }
        }
        newNote = {
          ...newNote,
          ...note,
          scheduledTo: scheduledDate,
        };
        updateLastNote(null);
      }
    } catch (e: any) {
      if (e instanceof CancelError) {
        return;
      }
      toast.error("Failed to save note");
      return;
    }
    if (shouldSchedule) {
      try {
        await scheduleNote(newNote);
        handleOpenChange(false);
        toast.success(
          "Note scheduled to: " + getScheduleTimeText(scheduledDate, false),
          {
            autoClose: 6000,
          },
        );
      } catch (e: any) {
        if (e instanceof CancelError) {
          return;
        }
        if (e instanceof NoSubstackCookiesError) {
          setShowNoSubstackCookiesDialog(true);
        } else {
          toast.error("Failed to schedule note. Try again please.");
        }
        return;
      }
    } else if (selectedNote?.status === "scheduled") {
      setUnscheduling(true);
      try {
        await updateNoteStatus(selectedNote.id, "draft");
        toast.info("Note unscheduled");
        handleOpenChange(false);
      } catch (e: any) {
        if (e instanceof CancelError) {
          return;
        }
        toast.error("Failed to unschedule note");
        return;
      } finally {
        setUnscheduling(false);
      }
    }
  };

  const handleSubstackLogin = () => {
    initCanUserScheduleInterval()
      ?.then(() => {
        setShowNoSubstackCookiesDialog(false);
      })
      .catch(() => {
        toast.error("Didn't find any Substack login. Try again please.");
      });
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

  const [showNoSubstackCookiesDialog, setShowNoSubstackCookiesDialog] =
    useState(false);

  // Determine button text based on current state
  const saveButtonText = useMemo(() => {
    let text = "Save";
    const textComponent = (text: string) => <span>{text}</span>;
    if (isEmptyNote(selectedNote)) {
      if (loadingScheduleNote) {
        return textComponent("Scheduling note...");
      }
      if (loadingEditNote) {
        return textComponent("Creating note...");
      }
      if (confirmedSchedule) {
        return textComponent("Save and schedule");
      } else {
        return textComponent("Create new draft");
      }
    }
    if (noteSaved) {
      // [checkmark] saved
      return (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-foreground" />
          <span>Saved</span>
        </div>
      );
    }

    if (loadingEditNote) {
      text = unscheduling ? "Unscheduling note..." : "Saving note...";
    } else if (loadingScheduleNote) {
      text = "Scheduling note...";
    } else if (confirmedSchedule) {
      text = "Schedule";
    } else if (selectedNote?.status === "scheduled") {
      text = "Unschedule";
    }

    return textComponent(text);
  }, [
    noteSaved,
    loadingEditNote,
    loadingScheduleNote,
    unscheduling,
    confirmedSchedule,
    selectedNote?.status,
  ]);

  const handleFileUpload = async (file: File) => {
    if (!selectedNote) return;
    try {
      const isEmpty = isEmptyNote(selectedNote);
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
    debugger;
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
    if (isEmpty || isInspiration) {
      return false;
    }
    return !loadingEditNote && !loadingScheduleNote && !isSendingNote;
  }, [
    loadingEditNote,
    loadingScheduleNote,
    isSendingNote,
    isEmpty,
    isInspiration,
  ]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          closeOnOutsideClick={
            !loadingEditNote &&
            !loadingScheduleNote &&
            !isSendingNote &&
            !isUploadingFile
          }
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
                <AvatarImage src={thumbnail || user?.image || ""} alt="User" />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">
                  {name || userName}
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

            <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t border-border gap-4 md:gap-0">
              <div className="flex gap-2 items-center">
                <ScheduleNote
                  initialScheduledDate={scheduledDate}
                  confirmedSchedule={confirmedSchedule}
                  onScheduleConfirm={handleConfirmSchedule}
                  onScheduleClear={handleClearSchedule}
                  disabled={
                    isSendingNote || loadingEditNote || loadingScheduleNote
                  }
                />
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
                <InstantPostButton
                  onPreSend={handleSave}
                  note={selectedNote}
                  source="note-editor-dialog"
                  onLoadingChange={setIsSendingNote}
                  disabled={!canSendNote}
                />
                <Button
                  variant="default"
                  className="rounded-full px-6"
                  onClick={handleSave}
                  disabled={
                    loadingEditNote ||
                    loadingScheduleNote ||
                    isSendingNote ||
                    noteSaved
                  }
                >
                  {saveButtonText}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ExtensionInstallDialog
        open={showExtensionDialog}
        onOpenChange={setShowExtensionDialog}
        onInstall={() => {
          setShowExtensionDialog(false);
        }}
      />
      <NoSubstackCookiesDialog
        open={showNoSubstackCookiesDialog}
        onOpenChange={setShowNoSubstackCookiesDialog}
        onSubstackLogin={handleSubstackLogin}
        onCancel={() => {
          setShowNoSubstackCookiesDialog(false);
          cancelCanUserScheduleInterval();
        }}
        loading={isIntervalRunning}
      />
    </>
  );
}
