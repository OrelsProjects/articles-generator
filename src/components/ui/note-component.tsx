import { Button } from "@/components/ui/button";
import { useNotes } from "@/lib/hooks/useNotes";
import { cn } from "@/lib/utils";
import {
  convertMDToHtml,
  Note,
  NoteDraft,
  NoteFeedback,
  NoteStatus,
} from "@/types/note";
import {
  ExternalLink,
  Heart,
  MessageCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  X,
  Trash,
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
  const [feedbackText, setFeedbackText] = useState("");

  const handleSubmit = () => {
    onSubmit(feedbackText);
    setFeedbackText("");
  };

  if (feedback === "dislike") {
    return (
      <Button
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
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
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
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              What didn't you like about this note?
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
          <textarea
            className="w-full h-20 px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Let us know so we can improve future notes for you :)"
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSubmit}>
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
      return note.attachments?.[0];
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
  // , {
  //   "border-primary/60": note.id === selectedNote?.id,
  // }
  const Reactions = () =>
    noteReactions && (
      <div className="flex justify-between items-center mt-3">
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
      </div>
    );

  const Author = () => (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden cursor-pointer">
            {note.thumbnail ? (
              <Image
                src={note.thumbnail}
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
            {note.thumbnail ? (
              <Image
                src={note.thumbnail}
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
    feedbackText?: string,
  ) => {
    setLoadingFeedback(type);
    updateNoteFeedback(note.id, type);

    if (feedbackText && type === "dislike") {
      // You might want to handle this feedback text in your backend
      console.log("Feedback text:", feedbackText);
    }

    toast.info("Thank you. We'll adjust future notes accordingly.");
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
      <div className={cn("w-full flex items-center gap-0")}>
        <TooltipButton
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
        {/* Delete */}
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
        setShowExpandButton(contentRef.current!.scrollHeight > 260);
      });
    }
  }, [htmlContent]);

  return (
    <div
      className={cn(
        "flex flex-col relative rounded-xl shadow-sm border border-border/60",
        {
          "border-primary/80": note.id === selectedNote?.id,
        },
      )}
    >
      <div className="flex flex-col items-start gap-4 transition-opacity duration-200">
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
          className={cn("flex-1", {
            "opacity-60": feedback === "dislike",
          })}
        >
          <div className="relative">
            <div
              ref={contentRef}
              className={cn(
                "relative text-base text-foreground overflow-hidden transition-all duration-200 p-4 pt-0",
                isExpanded ? "max-h-none" : "max-h-[260px]",
              )}
            >
              <div
                className="prose prose-sm max-w-none note-component-content"
                dangerouslySetInnerHTML={{
                  __html: htmlContent,
                }}
              />
            </div>
            {showExpandButton && (
              <div className="relative h-4 w-full">
                <Button
                  variant="link"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="absolute bottom-0 right-4 text-xs text-primary hover:underline focus:outline-none mt-1 block ml-auto z-10"
                >
                  {isExpanded ? "less" : "more"}
                </Button>
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent z-0",
                    isExpanded ? "opacity-0" : "opacity-100",
                  )}
                />
              </div>
            )}
          </div>
          {attachment && (
            <div
              className="mt-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-200"
              onClick={() =>
                selectImage({
                  url: attachment[0],
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
        <div className="w-full flex items-center justify-between border-t border-border/60 py-2">
          <div className="w-full flex items-center gap-2">
            <Reactions />
            <div className="w-full flex items-center justify-between gap-2 px-2">
              <NotesActions />
              <Button
                onClick={() => selectNote(note, { forceShowEditor: true })}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Edit & post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Actions Bar */}
      {!isUserNote && (
        <div className="absolute -bottom-2 left-0 right-0 bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex justify-between items-center z-50">
          {entityKey && (
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`https://substack.com/@${handle}/note/${entityKey}?utm_source=writeroom`}
                target="_blank"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
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
      )}
    </div>
  );
}
