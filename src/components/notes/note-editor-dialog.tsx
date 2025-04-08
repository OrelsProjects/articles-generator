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
import { convertMDToHtml, isEmptyNote, NoteDraftImage } from "@/types/note";
import { isScheduled, getScheduleTimeText } from "@/lib/utils/date/schedule";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { useExtension } from "@/lib/hooks/useExtension";
import { InstantPostButton } from "@/components/notes/instant-post-button";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import { NoSubstackCookiesError } from "@/types/errors/NoSubstackCookiesError";
import NoSubstackCookiesDialog from "@/components/notes/no-substack-cookies-dialog";
import EmojiPopover from "@/components/notes/emoji-popover";
import { Skin } from "@emoji-mart/data";
import { copyHTMLToClipboard } from "@/lib/utils/copy";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { FrontendModel } from "@/components/notes/ai-models-dropdown";
import ScheduleNote from "@/components/notes/schedule-note";
import ImageDropOverlay from "@/components/notes/image-drop-overlay";
import { NoteImageContainer } from "@/components/notes/note-image-container";
import { Skeleton } from "@/components/ui/skeleton";
import { AIToolsDropdown } from "@/components/notes/ai-tools-dropdown";
import { Button } from "@/components/ui/button";
import { CancelError } from "@/types/errors/CancelError";

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
  } = useNotes();
  const {
    scheduleNote,
    loadingScheduleNote,
    initCanUserScheduleInterval,
    isIntervalRunning,
    cancelCanUserScheduleInterval,
  } = useNotesSchedule();

  const { isLoading: isSendingNote, hasExtension } = useExtension();
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  // setOpen MUST be called only from handleOpenChange to avoid logic bugs, like setting body to ''.
  const [open, setOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined,
  );
  const [body, setBody] = useState("");
  const [unscheduling, setUnscheduling] = useState(false);
  const [confirmedSchedule, setConfirmedSchedule] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // State for drag and drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleOpenChange = (open: boolean, caller: string) => {
    setOpen(open);
    if (!open) {
      setBody("");
      selectNote(null);
    }
    console.log("handleOpenChange", open, caller);
  };

  useEffect(() => {
    if (selectedNote && !body) {
      handleOpenChange(true, "useEffect selectedNote && !body");
      convertMDToHtml(selectedNote.body).then(html => {
        setBody(selectedNote.body);
        editor?.commands.setContent(html);
      });
      if (selectedNote.status === "scheduled" && selectedNote.scheduledTo) {
        const presetDate = new Date(selectedNote.scheduledTo);
        setScheduledDate(presetDate);
        setConfirmedSchedule(true);
      } else {
        setConfirmedSchedule(false);
      }
    }
  }, [selectedNote]);

  const editor = useEditor(notesTextEditorOptions(handleBodyChange));

  async function handleBodyChange(
    html: string,
    options?: { immediate?: boolean },
  ) {
    const newBody = unformatText(html);
    setBody(newBody);
    if (selectedNote) {
      if (options?.immediate) {
        await editNoteBody(selectedNote.id, newBody);
      } else {
        updateNoteBody(selectedNote.id, newBody);
      }
    }
  }

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
    const shouldSchedule = scheduleIsSet && scheduledDate;
    try {
      await handleBodyChange(editor?.getHTML() || "", { immediate: true });
    } catch (e: any) {
      if (e instanceof CancelError) {
        return;
      }
      toast.error("Failed to save note");
      return;
    }
    if (shouldSchedule) {
      try {
        const newNote = {
          ...selectedNote,
          scheduledTo: scheduledDate,
        };
        await scheduleNote(newNote);
        handleOpenChange(false, "handleSave scheduleNote");
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
          toast.error("Failed to schedule note");
        }
        return;
      }
    } else if (selectedNote?.status === "scheduled") {
      setUnscheduling(true);
      try {
        await updateNoteStatus(selectedNote.id, "draft");
        handleOpenChange(false, "handleSave unscheduleNote");
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
    editor?.chain().focus().setContent(formattedText).run();
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
    }

    if (loadingScheduleNote) {
      text = "Scheduling note...";
    }

    if (confirmedSchedule) {
      text = "Schedule";
    }

    if (selectedNote?.status === "scheduled") {
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

  // Handle file upload when an image is dropped
  const handleFileDrop = useCallback(
    async (file: File) => {
      if (!selectedNote) return;

      // Check if there's already an image
      if (selectedNote.attachments && selectedNote.attachments.length > 0) {
        setIsDraggingOver(false);
        toast.error("Only one image is allowed");
        return;
      }

      try {
        setIsDraggingOver(false);
        await uploadFile(file, selectedNote.id);
      } catch (error) {
        toast.error("Failed to upload image");
        console.error(error);
      }
    },
    [selectedNote, uploadFile],
  );

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

  const handleImageSelect = useCallback(
    async (file: File) => {
      if (!selectedNote) return;

      // Check if there's already an image
      if (selectedNote.attachments && selectedNote.attachments.length > 0) {
        toast.error("Only one image is allowed");
        return;
      }

      try {
        await uploadFile(file, selectedNote.id);
      } catch (error) {
        toast.error("Failed to upload image");
        console.error(error);
      }
    },
    [selectedNote, uploadFile],
  );

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

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={open => {
          handleOpenChange(open, "Dialog");
        }}
      >
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
                  selectedNote.attachments.length > 0 && (
                    <div className="mt-4 mb-4 flex flex-wrap gap-2">
                      {selectedNote.attachments.map(attachment => (
                        <NoteImageContainer
                          key={attachment.id}
                          imageUrl={attachment.url}
                          onImageSelect={handleImageSelect}
                          onImageDelete={handleImageDelete}
                          attachment={attachment}
                        />
                      ))}
                    </div>
                  )}
                {uploadingFile && (
                  <Skeleton className="w-[180px] h-[96px] rounded-md" />
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
                  disabled={!body}
                  onClick={handleCopy}
                >
                  <Copy className="h-5 w-5 text-muted-foreground" />
                </TooltipButton>
              </div>
              <div className="flex gap-3">
                <InstantPostButton
                  note={selectedNote}
                  source="note-editor-dialog"
                  includeText
                />
                <Button
                  variant="default"
                  className="rounded-full px-6"
                  onClick={handleSave}
                  disabled={
                    editor?.getText().trim().length === 0 ||
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
