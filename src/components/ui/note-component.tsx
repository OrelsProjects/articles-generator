import { Button } from "@/components/ui/button";
import { useNotes } from "@/lib/hooks/useNotes";
import { cn } from "@/lib/utils";
import { convertMDToHtml, Note, NoteDraft, NoteFeedback } from "@/types/note";
import {
  Heart,
  MessageCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  X,
  Archive,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "react-toastify";
import { TooltipButton } from "@/components/ui/tooltip-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubstackPostButton } from "@/components/notes/substack-post-button";

// Define feedback options
const FEEDBACK_OPTIONS = [
  {
    value: "It has incorrect information about me",
    label: "It has incorrect information about me",
  },
  {
    value: "The note is irrelevant or false",
    label: "The note is irrelevant or false",
  },
  { value: "The note is boring", label: "The note is boring" },
];

type DislikeFeedbackPopoverProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedbackText: string) => void;
  isLoading: boolean;
  feedback: NoteFeedback | null | undefined;
  disabled?: boolean;
};

const DislikeFeedbackPopover = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading,
  feedback,
  disabled,
}: DislikeFeedbackPopoverProps) => {
  const [feedbackReason, setFeedbackReason] = useState("");

  const handleSubmit = () => {
    onSubmit(feedbackReason);
    setFeedbackReason("");
  };

  if (feedback === "dislike") {
    return (
      <TooltipButton
        tooltipContent="Dislike - this helps our AI understand what you don't like"
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={cn("hover:text-primary", "text-primary")}
        onClick={e => {
          if (feedback === "dislike") {
            e.preventDefault();
            onOpenChange(false);
            handleSubmit();
          }
        }}
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown className="h-4 w-4" />
        )}
      </TooltipButton>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <TooltipButton
          tooltipContent="Dislike - this helps our AI understand what you don't like"
          disabled={disabled}
          variant="ghost"
          size="sm"
          className={cn("hover:text-primary")}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsDown className="h-4 w-4" />
          )}
        </TooltipButton>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              What didn&apos;t you like about this note?
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Select value={feedbackReason} onValueChange={setFeedbackReason}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={!feedbackReason}
            >
              Submit
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export type NoteProps = {
  note: Note | NoteDraft;
};

export default function NoteComponent({ note }: NoteProps) {
  const {
    selectImage,
    updateNoteStatus,
    updateNoteFeedback,
    selectNote,
    selectedNote,
  } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState<string | null>(null);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [isDislikePopoverOpen, setIsDislikePopoverOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const isUserNote = useMemo(() => {
    if ("reactionCount" in note) {
      return false;
    }
    return true;
  }, [note]);

  const handle = useMemo(() => {
    if ("handle" in note) {
      return note.handle;
    }
    return null;
  }, [note]);

  const attachment = useMemo(() => {
    if ("attachment" in note) {
      return note.attachment as string;
    }
    return null;
  }, [note]);

  const entityKey = useMemo(() => {
    if ("entityKey" in note) {
      return note.entityKey;
    }
    return null;
  }, [note]);

  const feedback = useMemo(() => {
    if ("feedback" in note) {
      return note.feedback;
    }
    return null;
  }, [note]);

  const thumbnail = useMemo(() => {
    if ("thumbnail" in note) {
      if (
        note.thumbnail?.includes("substackcdn") ||
        note.thumbnail?.includes("substack-post-media")
      ) {
        return note.thumbnail;
      }
    }
    return null;
  }, [note]);

  const noteReactions = useMemo(() => {
    let reactions: {
      reactionCount: number;
      commentsCount: number;
      restacks: number;
    } | null = null;
    const hasReactionCount = "reactionCount" in note;
    const hasCommentsCount = "commentsCount" in note;
    const hasRestacks = "restacks" in note;
    const hasReactions = hasReactionCount || hasCommentsCount || hasRestacks;
    if (hasReactions) {
      reactions = {
        reactionCount: hasReactionCount ? note.reactionCount : 0,
        commentsCount: hasCommentsCount ? note.commentsCount : 0,
        restacks: hasRestacks ? note.restacks : 0,
      };
    }
    return reactions;
  }, [note]);

  const Reactions = () =>
    noteReactions && (
      <Link
        className="flex justify-between items-center pl-2"
        href={`https://substack.com/@${handle}/note/${entityKey}?utm_source=writeroom`}
        target="_blank"
      >
        <div className="flex space-x-3">
          <span className="text-xs text-muted-foreground flex items-center text-red-500">
            <Heart className="h-4 w-4 mr-1 text-red-500 fill-red-500" />
            {noteReactions.reactionCount}
          </span>
          <span className="text-xs text-muted-foreground flex items-center">
            <MessageCircle className="h-4 w-4 mr-1" />
            {noteReactions.commentsCount}
          </span>
          <span className="text-xs text-muted-foreground flex items-center">
            <RefreshCw className="h-4 w-4 mr-1" />
            <p>{noteReactions.restacks}</p>
          </span>
        </div>
      </Link>
    );

  const Author = () => (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden cursor-pointer">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={note.authorName || "Author"}
                width={32}
                height={32}
                className="object-cover w-full h-full hover:opacity-90 transition-opacity"
              />
            ) : (
              <span className="text-sm">
                {note.authorName?.charAt(0) || "A"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-sm">{note.authorName}</p>
              {handle && (
                <Link
                  href={`https://substack.com/@${handle}`}
                  target="_blank"
                  className="text-xs text-muted-foreground"
                >
                  @{handle}
                </Link>
              )}
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" side="bottom" align="start">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={note.authorName || "Author"}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg">
                  {note.authorName?.charAt(0) || "A"}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-medium text-sm">{note.authorName}</p>
            {handle && (
              <Link
                href={`https://substack.com/@${handle}`}
                target="_blank"
                className="text-xs text-muted-foreground"
              >
                @{handle}
              </Link>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  const handleFeedbackChange = (
    type: "like" | "dislike",
    feedbackReason?: string,
  ) => {
    setLoadingFeedback(type);
    updateNoteFeedback(note.id, type, feedbackReason);

    if (feedbackReason && type === "dislike") {
      // Get the label for the selected reason
      const selectedOption = FEEDBACK_OPTIONS.find(
        option => option.value === feedbackReason,
      );
      const reasonLabel = selectedOption
        ? selectedOption.label
        : feedbackReason;

      // Log the feedback reason
      console.log("Feedback reason:", reasonLabel);

      // Show a more specific toast message based on the feedback reason
      toast.info(
        `Thanks for your feedback. We'll avoid ${
          feedbackReason === "incorrect-info"
            ? "incorrect information"
            : feedbackReason === "irrelevant"
              ? "irrelevant content"
              : "boring notes"
        } in the future.`,
      );
    } else {
      toast.info("We'll adjust future notes accordingly.");
    }

    setLoadingFeedback(null);
    setIsDislikePopoverOpen(false);
  };

  const extraFeedbackText =
    isUserNote && feedback !== null
      ? " Your feedback will still be saved."
      : "";

  const handleArchive = async () => {
    // yes no alert
    const confirm = window.confirm(
      `Are you sure you want to archive this note?${extraFeedbackText}`,
    );
    if (!confirm) return;
    setLoadingArchive(true);
    try {
      await updateNoteStatus(note.id, "archived");
    } catch (error) {
      toast.error("Failed to archive note");
    } finally {
      setLoadingArchive(false);
    }
  };

  const NotesActions = () =>
    isUserNote && (
      <div className={cn("w-full flex items-center justify-between")}>
        <div className={cn("w-full flex items-center gap-0")}>
          <TooltipButton
            tooltipContent="Like - this helps our AI understand what you like"
            disabled={loadingFeedback === "like" || loadingArchive}
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackChange("like")}
            className={cn(
              "hover:text-primary",
              feedback === "like" && "text-primary",
            )}
          >
            {loadingFeedback === "like" ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className="h-4 w-4" />
            )}
          </TooltipButton>
          <DislikeFeedbackPopover
            disabled={loadingFeedback === "dislike" || loadingArchive}
            isOpen={isDislikePopoverOpen}
            onOpenChange={setIsDislikePopoverOpen}
            onSubmit={text => handleFeedbackChange("dislike", text)}
            isLoading={loadingFeedback === "dislike"}
            feedback={feedback}
          />
        </div>
        <TooltipButton
          tooltipContent={
            "Archive note" +
            (extraFeedbackText ? ` (${extraFeedbackText})` : "")
          }
          variant="ghost"
          size="sm"
          className="hover:text-red-500"
          disabled={loadingArchive}
          onClick={handleArchive}
        >
          {loadingArchive ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
        </TooltipButton>

        {/* Replace the Substack posting button with the new component */}
        <SubstackPostButton note={note} size="sm" variant="ghost" />
      </div>
    );

  useEffect(() => {
    convertMDToHtml(note.body).then(html => {
      setHtmlContent(html);
    });
  }, [note.body]);

  // Once the HTML is loaded, measure to see if it exceeds 260px
  useEffect(() => {
    if (contentRef.current) {
      requestAnimationFrame(() => {
        setShowExpandButton((contentRef.current?.scrollHeight || 999) > 260);
      });
    }
  }, [htmlContent]);

  return (
    <>
      <div
        className={cn(
          "flex flex-col relative rounded-xl shadow-sm border border-border/60 bg-card",
          {
            "border-primary/80": note.id === selectedNote?.id,
          },
        )}
      >
        <div className="h-full flex flex-col justify-between gap-4 transition-opacity duration-200">
          <div className="w-full flex-col items-start gap-4 transition-opacity duration-200">
            <div
              className={cn(
                "w-full flex justify-between border-b border-border/60 p-2",
                {
                  "opacity-60": feedback === "dislike",
                },
              )}
            >
              <Author />
              <div className="flex items-center gap-2">
                {/* date */}
                <p className="text-xs text-muted-foreground">
                  {new Date(note.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div
              className={cn("w-full flex-1", {
                "opacity-60": feedback === "dislike",
              })}
            >
              <div className="w-full relative z-20">
                {/* Content */}
                <div
                  ref={contentRef}
                  className={cn(
                    "w-full relative text-base text-foreground overflow-hidden transition-all duration-200 p-4 pt-0 cursor-pointer z-10",
                    isExpanded ? "max-h-none" : "max-h-[260px]",
                    isUserNote && "cursor-pointer",
                  )}
                  onClick={() => selectNote(note)}
                >
                  <div
                    className="prose prose-sm max-w-none note-component-content"
                    dangerouslySetInnerHTML={{
                      __html: htmlContent,
                    }}
                  />
                </div>
                {/* Expand Button */}
                {showExpandButton && (
                  <div className="relative h-4 w-full z-20">
                    <Button
                      variant="link"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="absolute bottom-0 right-4 text-xs text-primary hover:underline focus:outline-none mt-1 block ml-auto"
                    >
                      {isExpanded ? "less" : "more"}
                    </Button>
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent -z-10",
                        isExpanded ? "opacity-0" : "opacity-100",
                      )}
                    />
                  </div>
                )}
                {/* Hover Actions Bar */}
                {/* {!isUserNote && (
                  <div className="absolute -bottom-2 left-0 right-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex justify-between items-center z-30">
                    {entityKey && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`https://substack.com/@${handle}/note/${entityKey}?utm_source=writeroom`}
                          target="_blank"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 z-30"
                        >
                          View on Substack
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      onClick={() => selectNote(note)}
                    >
                      <span className="text-xs">Edit & post</span>
                    </Button>
                  </div>
                )} */}
              </div>
              {attachment && (
                <div
                  className="mt-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-200"
                  onClick={() =>
                    selectImage({
                      url: attachment,
                      alt: "Note attachment",
                    })
                  }
                >
                  <Image
                    src={attachment}
                    alt="Attachment"
                    width={400}
                    height={300}
                    className="w-full h-auto rounded-lg hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="w-full flex items-center justify-between border-t border-border/60 py-2">
            <div className="w-full flex items-center justify-between gap-2">
              <Reactions />
              <div
                className={cn("flex items-center justify-between gap-2 px-2", {
                  "w-full pr-4": isUserNote,
                })}
              >
                <NotesActions />
                <Button
                  onClick={() =>
                    selectNote(note, {
                      forceShowEditor: true,
                      isFromInspiration: true,
                    })
                  }
                  variant="link"
                  size="sm"
                  className={cn("text-xs p-0 text-foreground", {
                    hidden: isUserNote,
                  })}
                >
                  Edit & post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
