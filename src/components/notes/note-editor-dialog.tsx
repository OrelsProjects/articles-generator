"use client";

import { useMemo, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CalendarClock, Copy } from "lucide-react";
import { selectNotes } from "@/lib/features/notes/notesSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { addHours } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatText,
  notesTextEditorOptions,
  unformatText,
} from "@/lib/utils/text-editor";
import { useEditor } from "@tiptap/react";
import NoteEditor from "@/components/notes/note-editor";
import { useNotes } from "@/lib/hooks/useNotes";
import { toast } from "react-toastify";
import { convertMDToHtml } from "@/types/note";
import {
  getMonthValue,
  getDayValue,
  getYearValue,
  getHourValue,
  getMinuteValue,
  getAmPmValue,
  generateDays,
  generateHours,
  generateMinutes,
  generateYears,
  isScheduled,
  getScheduleTimeText,
  months,
  updateMonth,
  updateDay,
  updateYear,
  updateHour,
  updateMinute,
  updateAmPm,
  isValidScheduleTime,
  getInvalidTimeMessage,
} from "@/lib/utils/date/schedule";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
import { useUi } from "@/lib/hooks/useUi";
import { useExtension } from "@/lib/hooks/useExtension";
import { InstantPostButton } from "@/components/notes/instant-post-button";
import { ExtensionInstallDialog } from "@/components/notes/extension-install-dialog";
import { NoSubstackCookiesError } from "@/types/errors/NoSubstackCookiesError";
import NoSubstackCookiesDialog from "@/components/notes/no-substack-cookies-dialog";
import AIImproveDropdown from "@/components/notes/ai-improve-dropdown";
import EmojiPopover from "@/components/notes/emoji-popover";
import { Skin } from "@emoji-mart/data";
import { copyHTMLToClipboard } from "@/lib/utils/copy";
import { selectAuth } from "@/lib/features/auth/authSlice";
import {
  AiModelsDropdown,
  FrontendModel,
} from "@/components/notes/ai-models-dropdown";
export function NotesEditorDialog() {
  const { user } = useAppSelector(selectAuth);
  const { selectedNote, thumbnail } = useAppSelector(selectNotes);
  const { showScheduleModal, updateShowScheduleModal } = useUi();
  const {
    updateNoteBody,
    editNoteBody,
    selectNote,
    loadingEditNote,
    updateNoteStatus,
    uploadFile,
  } = useNotes();
  const {
    scheduleNote,
    loadingUpdateNote,
    initCanUserScheduleInterval,
    isIntervalRunning,
    cancelCanUserScheduleInterval,
  } = useNotesSchedule();

  const { isLoading: isSendingNote, hasExtension } = useExtension();
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<FrontendModel>("claude-3.7");

  const [open, setOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined,
  );
  const [body, setBody] = useState("");
  const [unscheduling, setUnscheduling] = useState(false);
  const [confirmedSchedule, setConfirmedSchedule] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [showNoSubstackCookiesDialog, setShowNoSubstackCookiesDialog] =
    useState(false);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setBody("");
      selectNote(null);
    }
  };

  useEffect(() => {
    if (showScheduleModal) {
      setScheduleDialogOpen(true);
      updateShowScheduleModal(false);
    }
  }, [open]);

  useEffect(() => {
    if (selectedNote && !body) {
      handleOpenChange(true);
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

  // Set default time to one hour from now when opening the schedule dialog
  useEffect(() => {
    if (scheduleDialogOpen && !scheduledDate) {
      const defaultDate = addHours(new Date(), 1);
      setScheduledDate(defaultDate);
    }
  }, [scheduleDialogOpen, scheduledDate]);

  // Validate the schedule time whenever it changes
  useEffect(() => {
    if (scheduledDate) {
      setTimeError(
        isValidScheduleTime(scheduledDate) ? null : getInvalidTimeMessage(),
      );
    } else {
      setTimeError(null);
    }
  }, [scheduledDate]);

  const editor = useEditor(notesTextEditorOptions(handleBodyChange));

  async function handleBodyChange(
    html: string,
    options?: { immediate?: boolean },
  ) {
    const newBody = unformatText(html);

    setBody(newBody);
    try {
      if (selectedNote) {
        if (options?.immediate) {
          await editNoteBody(selectedNote.id, newBody);
        } else {
          updateNoteBody(selectedNote.id, newBody);
        }
      }
    } catch (e: any) {
      toast.error(e.message);
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

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const scheduleIsSet = isScheduled(scheduledDate) && confirmedSchedule;
  const isTimeValid = !timeError;

  const handleClearSchedule = () => {
    setScheduledDate(undefined);
    setScheduleDialogOpen(false);
    setConfirmedSchedule(false);
    setTimeError(null);
  };

  // Handle confirming the schedule
  const handleConfirmSchedule = async () => {
    const userHasExtension = await hasExtension();
    if (!userHasExtension) {
      setShowExtensionDialog(true);
      return;
    }
    if (scheduledDate && isValidScheduleTime(scheduledDate)) {
      setConfirmedSchedule(true);
      setScheduleDialogOpen(false);
    } else {
      setTimeError(getInvalidTimeMessage());
    }
  };

  // Update a date field
  const handleDateUpdate = (type: "month" | "day" | "year", value: string) => {
    if (!scheduledDate) {
      const now = new Date();
      setScheduledDate(now);
      return;
    }

    let updatedDate: Date;

    switch (type) {
      case "month":
        updatedDate = updateMonth(scheduledDate, value);
        break;
      case "day":
        updatedDate = updateDay(scheduledDate, value);
        break;
      case "year":
        updatedDate = updateYear(scheduledDate, value);
        break;
      default:
        return;
    }

    setScheduledDate(updatedDate);
  };

  // Update a time field
  const handleTimeUpdate = (
    type: "hour" | "minute" | "ampm",
    value: string,
  ) => {
    if (!scheduledDate) {
      const now = new Date();
      setScheduledDate(now);
      return;
    }

    let updatedDate: Date;

    switch (type) {
      case "hour":
        updatedDate = updateHour(scheduledDate, value);
        break;
      case "minute":
        updatedDate = updateMinute(scheduledDate, value);
        break;
      case "ampm":
        updatedDate = updateAmPm(scheduledDate, value);
        break;
      default:
        return;
    }

    setScheduledDate(updatedDate);
  };

  // Render the scheduled time text with a CalendarClock icon
  const renderScheduleTimeText = () => {
    if (!scheduledDate) return null;

    return (
      <div className="flex items-center gap-2 text-base text-foreground">
        <CalendarClock className="h-5 w-5" />
        {getScheduleTimeText(scheduledDate)}
      </div>
    );
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    try {
      await handleBodyChange(editor?.getHTML() || "", { immediate: true });
    } catch (e: any) {
      toast.error("Failed to save note");
      return;
    }
    if (scheduleIsSet && scheduledDate) {
      try {
        const newNote = {
          ...selectedNote,
          scheduledTo: scheduledDate,
        };
        await scheduleNote(newNote);
        handleOpenChange(false);
        toast.success(
          "Note scheduled to: " + getScheduleTimeText(scheduledDate, false),
          {
            autoClose: 6000,
          },
        );
      } catch (e: any) {
        if (e instanceof NoSubstackCookiesError) {
          setShowNoSubstackCookiesDialog(true);
        } else {
          toast.error("Failed to schedule note");
        }
      }
    } else if (selectedNote?.status === "scheduled") {
      setUnscheduling(true);
      try {
        await updateNoteStatus(selectedNote.id, "draft");
        handleOpenChange(false);
      } catch (e: any) {
        toast.error("Failed to unschedule note");
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

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          hideCloseButton
          className="sm:min-w-[600px] sm:min-h-[290px] p-0 gap-0 border-border bg-background rounded-2xl"
        >
          <div className="flex flex-col w-full">
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
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="flex gap-2 items-center">
                <Dialog
                  open={scheduleDialogOpen}
                  onOpenChange={setScheduleDialogOpen}
                >
                  <DialogTrigger asChild>
                    <TooltipButton
                      tooltipContent="Schedule note"
                      variant="ghost"
                      size="icon"
                      className={`${confirmedSchedule ? "text-primary/95 hover:text-primary" : "text-muted-foreground"} `}
                    >
                      <CalendarClock className="h-5 w-5" />
                    </TooltipButton>
                  </DialogTrigger>

                  <DialogContent
                    hideCloseButton
                    className="max-w-[550px] p-0 gap-0 border-border bg-background rounded-xl"
                  >
                    <div className="p-6 flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">
                          Schedule
                        </h2>
                        <div className="flex gap-3">
                          <Button
                            variant="ghost"
                            className="hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={handleClearSchedule}
                          >
                            Clear
                          </Button>
                          <Button
                            className="rounded-full px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleConfirmSchedule}
                            disabled={!isTimeValid}
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>

                      {scheduleIsSet && (
                        <div className="py-2 px-4 bg-accent/30 rounded-md">
                          {renderScheduleTimeText()}
                        </div>
                      )}

                      {timeError && (
                        <div className="py-2 px-4 bg-destructive/20 text-destructive rounded-md text-sm">
                          {timeError}
                        </div>
                      )}

                      <div className="space-y-8">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-foreground">
                            Date
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            <Select
                              value={
                                scheduledDate
                                  ? getMonthValue(scheduledDate)
                                  : undefined
                              }
                              onValueChange={value =>
                                handleDateUpdate("month", value)
                              }
                            >
                              <SelectTrigger className="h-11 bg-background border-border">
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                {months.map(month => (
                                  <SelectItem
                                    key={month}
                                    value={month}
                                    className="focus:bg-accent focus:text-accent-foreground"
                                  >
                                    {month}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={
                                scheduledDate
                                  ? getDayValue(scheduledDate)
                                  : undefined
                              }
                              onValueChange={value =>
                                handleDateUpdate("day", value)
                              }
                            >
                              <SelectTrigger className="h-11 bg-background border-border">
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                {generateDays(scheduledDate).map(day => (
                                  <SelectItem
                                    key={day}
                                    value={day}
                                    className="focus:bg-accent focus:text-accent-foreground"
                                  >
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={
                                scheduledDate
                                  ? getYearValue(scheduledDate)
                                  : undefined
                              }
                              onValueChange={value =>
                                handleDateUpdate("year", value)
                              }
                            >
                              <SelectTrigger className="h-11 bg-background border-border">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                {generateYears().map(year => (
                                  <SelectItem
                                    key={year}
                                    value={year}
                                    className="focus:bg-accent focus:text-accent-foreground"
                                  >
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-foreground">
                            Time
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            <Select
                              value={
                                scheduledDate
                                  ? getHourValue(scheduledDate)
                                  : undefined
                              }
                              onValueChange={value =>
                                handleTimeUpdate("hour", value)
                              }
                            >
                              <SelectTrigger className="h-11 bg-background border-border">
                                <SelectValue placeholder="Hour" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                {generateHours().map(hour => (
                                  <SelectItem
                                    key={hour}
                                    value={hour}
                                    className="focus:bg-accent focus:text-accent-foreground"
                                  >
                                    {hour}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={
                                scheduledDate
                                  ? getMinuteValue(scheduledDate)
                                  : undefined
                              }
                              onValueChange={value =>
                                handleTimeUpdate("minute", value)
                              }
                            >
                              <SelectTrigger className="h-11 bg-background border-border">
                                <SelectValue placeholder="Minute" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border h-[200px]">
                                {generateMinutes().map(minute => (
                                  <SelectItem
                                    key={minute}
                                    value={minute}
                                    className="focus:bg-accent focus:text-accent-foreground"
                                  >
                                    {minute}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={
                                scheduledDate
                                  ? getAmPmValue(scheduledDate)
                                  : undefined
                              }
                              onValueChange={value =>
                                handleTimeUpdate("ampm", value)
                              }
                            >
                              <SelectTrigger className="h-11 bg-background border-border">
                                <SelectValue placeholder="AM/PM" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                <SelectItem
                                  value="AM"
                                  className="focus:bg-accent focus:text-accent-foreground"
                                >
                                  AM
                                </SelectItem>
                                <SelectItem
                                  value="PM"
                                  className="focus:bg-accent focus:text-accent-foreground"
                                >
                                  PM
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2 bg-muted/10 p-4 py-2 rounded-md">
                          <div className="text-muted-foreground text-lg font-medium">
                            {timezone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="flex items-center gap-0.5 border border-border/40 rounded-lg">
                  <AiModelsDropdown
                    onModelChange={setSelectedModel}
                    size="md"
                    classNameTrigger="!text-muted-foreground"
                  />
                  <AIImproveDropdown
                    note={selectedNote}
                    selectedModel={selectedModel}
                    onImprovement={handleImprovement}
                  />
                </div>
                <EmojiPopover onEmojiSelect={handleEmojiSelect} />
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
                <TooltipButton
                  tooltipContent={
                    confirmedSchedule
                      ? "Schedule"
                      : selectedNote?.status === "scheduled"
                        ? ""
                        : "Save"
                  }
                  variant="default"
                  className="rounded-full px-6"
                  onClick={handleSave}
                  disabled={
                    editor?.getText().trim().length === 0 ||
                    loadingEditNote ||
                    loadingUpdateNote ||
                    isSendingNote
                  }
                >
                  {loadingEditNote
                    ? unscheduling
                      ? "Unscheduling note..."
                      : "Saving note..."
                    : loadingUpdateNote
                      ? "Scheduling note..."
                      : confirmedSchedule
                        ? "Schedule"
                        : selectedNote?.status === "scheduled"
                          ? "Unschedule"
                          : "Save"}
                </TooltipButton>
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
