import { Button } from "@/components/ui/button";
import { useNotes } from "@/lib/hooks/useNotes";
import { cn } from "@/lib/utils";
import { convertMDToHtml, Note, NoteDraft, NoteStatus } from "@/types/note";
import {
  Heart,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  Trash,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { InstantPostButton } from "@/components/notes/instant-post-button";
import StatusBadgeDropdown from "@/components/notes/status-badge-dropdown";
import slugify from "slugify";
import { NoteImageContainer } from "@/components/notes/note-image-container";
import { AttachmentType } from "@prisma/client";
import { EditorContent, useEditor } from "@tiptap/react";
import { loadContent, notesTextEditorOptions } from "@/lib/utils/text-editor";
import { buildNoteUrl } from "@/lib/utils/note";

export type NoteProps = {
  note: Note | NoteDraft;
  onAuthorClick?: (handle: string) => void;
  onNoteArchived?: () => void;
  isFree?: boolean;
  options?: {
    allowAuthorClick?: boolean;
  };
};

const NotesActions = ({
  isUserNote,
  loadingArchive,
  handleArchive,
  note,
  extraFeedbackText,
  isFree,
}: {
  isUserNote: boolean;
  loadingArchive: boolean;
  extraFeedbackText: string;
  handleArchive: () => void;
  note: Note | NoteDraft;
  isFree: boolean;
}) =>
  isUserNote && (
    <div className={cn("w-full flex items-center justify-between")}>
      <TooltipButton
        tooltipContent={
          "Delete note" + (extraFeedbackText ? ` (${extraFeedbackText})` : "")
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
          <Trash className="h-4 w-4" />
        )}
      </TooltipButton>

      {/* Replace the Substack posting button with the new component */}
      {!isFree && (
        <InstantPostButton
          noteId={note.id}
          size="sm"
          variant="ghost"
          source="note_component"
        />
      )}
    </div>
  );

export default function NoteComponent({
  note,
  onAuthorClick,
  options = {
    allowAuthorClick: true,
  },
  isFree = false,
  onNoteArchived,
}: NoteProps) {
  const { selectImage, updateNoteStatus, selectNote, selectedNote } =
    useNotes();
  const [isExpanded, setIsExpanded] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const editor = useEditor(
    notesTextEditorOptions(
      html => {
        setHtmlContent(html);
      },
      {
        disabled: true,
        disabledClass: "opacity-100 text-foreground cursor-pointer",
      },
    ),
  );

  useEffect(() => {
    if (!editor) return;
    convertMDToHtml(note.body).then(html => {
      loadContent(html, editor);
    });
  }, [note.body, editor]);

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

  const attachments = useMemo(() => {
    if ("attachments" in note) {
      return note.attachments;
    }
    return [];
  }, [note]);

  const attachmentLinks = useMemo(() => {
    if (!attachments) {
      return [];
    }
    return attachments.filter(
      attachment => attachment.type === AttachmentType.link,
    );
  }, [attachments]);

  const attachmentImages = useMemo(() => {
    if (!attachments) {
      return [];
    }
    return attachments.filter(
      attachment => attachment.type === AttachmentType.image,
    );
  }, [attachments]);

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

  const handleAuthorClick = (handle: string) => {
    if (!options.allowAuthorClick) return;
    if (onAuthorClick) {
      onAuthorClick(handle);
    } else if (handle && !isUserNote) {
      let baseUrl = `/writer/${handle}`;
      if (note.authorName) {
        baseUrl += `/${slugify(note.authorName, {
          lower: true,
          strict: true,
        })}`;
      }
      window.open(baseUrl, "_blank");
    }
  };

  const Reactions = () =>
    noteReactions && (
      <div className="flex justify-between items-center pl-2">
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
    <div
      onClick={() => {
        if (handle && !isUserNote) {
          handleAuthorClick(handle);
        }
      }}
      className={cn(
        "flex items-center gap-2",
        {
          "cursor-pointer": handle && !isUserNote && options.allowAuthorClick,
        },
        {
          "cursor-default": !options.allowAuthorClick,
        },
      )}
    >
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={note.authorName || "Author"}
            width={32}
            height={32}
            className="object-cover w-full h-full hover:opacity-90 transition-opacity"
          />
        ) : (
          <span className="text-sm">{note.authorName?.charAt(0) || "A"}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          {isUserNote ? (
            <p className="font-medium text-sm">{note.authorName}</p>
          ) : (
            <p className="font-medium text-sm">{note.authorName}</p>
          )}
          {handle && <p className="text-xs text-muted-foreground">@{handle}</p>}
        </div>
      </div>
    </div>
  );

  const extraFeedbackText =
    isUserNote && feedback !== null
      ? " Your feedback will still be saved."
      : "";

  const handleArchive = async () => {
    setLoadingArchive(true);
    try {
      await updateNoteStatus(note.id, "archived");
      if (onNoteArchived) {
        onNoteArchived();
      }
    } catch (error) {
      toast.error("Failed to delete note");
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleSelectNote = () => {
    selectNote(note, {
      forceShowEditor: true,
      isFromInspiration: !isUserNote,
    });
  };

  useEffect(() => {
    convertMDToHtml(note.body).then(html => {
      setHtmlContent(html);
    });
  }, [note.body]);

  // Once the HTML is loaded, measure to see if it exceeds 260px
  useEffect(() => {
    if (contentRef.current) {
      requestAnimationFrame(() => {
        const height = contentRef.current?.scrollHeight || 999;
        setShowExpandButton(height > 260);
      });
    }
  }, [htmlContent]);

  return (
    <div
      className={cn(
        "h-full flex flex-col relative rounded-xl shadow-md border border-border/60 bg-card",
        {
          "border-primary/80": note.id === selectedNote?.id,
        },
      )}
    >
      <div className="h-full flex flex-col justify-between gap-4 transition-opacity duration-200">
        <div className="h-full w-full flex-col items-start gap-4 transition-opacity duration-200">
          <div
            className={cn(
              "w-full flex justify-between items-center border-b border-border/60 p-2 relative",
              {
                "opacity-60": feedback === "dislike",
              },
            )}
          >
            <Author />
            <div className=" flex items-center gap-2 top-0">
              {"status" in note && (
                <StatusBadgeDropdown
                  status={note.status as NoteStatus}
                  isArchived={note.isArchived}
                  scheduledTo={note.scheduledTo}
                />
              )}
            </div>
          </div>
          <div
            className={cn(
              "h-full w-full flex-1 flex flex-col justify-between pb-16",
              {
                "opacity-60": feedback === "dislike",
              },
            )}
          >
            <div className="w-full relative z-20">
              {/* Content */}
              <div
                ref={contentRef}
                className={cn(
                  "w-full relative text-base text-foreground overflow-hidden transition-all duration-200 p-4 pt-0 z-10 min-h-[180px] md:min-h-[200px]",
                  isExpanded ? "max-h-none" : "max-h-[260px]",
                  isUserNote && "cursor-pointer",
                )}
              >
                {/* Transparent overlay for click handling */}
                {/* {!isFree && ( */}
                <div
                  className="absolute inset-0 z-20 cursor-pointer"
                  onClick={handleSelectNote}
                  aria-hidden="true"
                />
                {/* )} */}

                <div className="text-sm text-foreground leading-relaxed">
                  <EditorContent disabled editor={editor} />
                </div>
              </div>
              {/* Expand Button */}
              {showExpandButton && (
                <div className="relative h-4 w-full z-20">
                  <Button
                    variant="link"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute -bottom-4 right-4 text-xs text-primary hover:underline focus:outline-none mt-1 block ml-auto"
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
            </div>
            {attachments && attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="mt-2 px-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attachmentImages.map((attachment, index) =>
                    isUserNote ? (
                      <div
                        key={index}
                        className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-200"
                        onClick={() =>
                          selectImage({
                            url: attachment.url,
                            alt: "Note attachment",
                          })
                        }
                      >
                        <NoteImageContainer
                          key={attachment.id}
                          imageUrl={attachment.url}
                          attachment={attachment}
                        />
                      </div>
                    ) : (
                      attachment.type === AttachmentType.image &&
                      !attachment.url.includes("heic") && (
                        <div
                          key={index}
                          className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-200"
                          onClick={() =>
                            selectImage({
                              url: attachment.url,
                              alt: "Note attachment",
                            })
                          }
                        >
                          <Image
                            src={attachment.url}
                            alt="Attachment"
                            width={200}
                            height={150}
                            className="rounded-lg hover:opacity-90 transition-opacity"
                          />
                        </div>
                      )
                    ),
                  )}
                </div>
                {attachmentLinks.length > 0 && (
                  <div className="mt-2 px-4 grid grid-cols-1 gap-2">
                    {attachmentLinks.map((attachment, index) => (
                      <div
                        key={index}
                        className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-200"
                        onClick={() => {
                          window.open(
                            typeof attachment === "string"
                              ? attachment
                              : attachment.url,
                            "_blank",
                          );
                        }}
                      >
                        <NoteImageContainer
                          key={index}
                          imageUrl={
                            typeof attachment === "string"
                              ? attachment
                              : attachment.url
                          }
                          attachment={
                            typeof attachment === "object"
                              ? attachment
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
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
              <NotesActions
                isUserNote={isUserNote}
                loadingArchive={loadingArchive}
                handleArchive={handleArchive}
                note={note}
                extraFeedbackText={extraFeedbackText}
                isFree={isFree}
              />
              {handle && entityKey && (
                <Button
                  onClick={() =>
                    window.open(
                      buildNoteUrl({
                        handle,
                        noteId: entityKey,
                      }),
                      "_blank",
                    )
                  }
                  variant="link"
                  size="sm"
                  className={cn(
                    "text-xs text-muted-foreground hover:text-foreground",
                    {
                      hidden: isUserNote,
                    },
                  )}
                >
                  View on Substack <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
