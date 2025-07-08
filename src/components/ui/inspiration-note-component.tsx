import { Button } from "@/components/ui/button";
import { useNotes } from "@/lib/hooks/useNotes";
import { cn } from "@/lib/utils";
import { convertMDToHtml, Note, NoteDraft, NoteStatus } from "@/types/note";
import {
  Heart,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Ban,
  Layers,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import StatusBadgeDropdown from "@/components/notes/status-badge-dropdown";
import slugify from "slugify";
import { NoteImageContainer } from "@/components/notes/note-image-container";
import { AttachmentType } from "@prisma/client";
import { EditorContent, useEditor } from "@tiptap/react";
import { loadContent, notesTextEditorOptions } from "@/lib/utils/text-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInspiration } from "@/lib/hooks/useInspiration";
import { Undo2 } from "lucide-react";
import { buildCreatorUrl } from "@/lib/utils/note";

export type NoteProps = {
  note: Note | NoteDraft;
  onAuthorClick?: (handle: string) => void;
  onNoteArchived?: () => void;
  isFree?: boolean;
  options?: {
    allowAuthorClick?: boolean;
  };
};

export default function InspirationNoteComponent({
  note,
  onAuthorClick,
  options = {
    allowAuthorClick: true,
  },
}: NoteProps) {
  const { selectImage, selectNote, selectedNote } = useNotes();
  const { blockWriter, unblockWriter } = useInspiration();
  const [isExpanded, setIsExpanded] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [showExpandButton, setShowExpandButton] = useState(false);
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
    } else if (handle) {
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
          <span className="text-xs text-muted-foreground flex items-center">
            <Heart className="h-4 w-4 mr-1" />
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

  const Author = () => {
    const handleBlockWriter = () => {
      if (note.authorId) {
        const authorId = note.authorId.toString();
        const authorName = note.authorName;

        blockWriter(authorId)
          .then(() => {
            // Store toast ID so we can dismiss it later
            const toastId = toast.info(
              <div className="flex items-center justify-between w-full">
                <span>
                  {authorName ? `${authorName}'s` : "Creator's"} notes hidden
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    unblockWriter(authorId)
                      .then(() => {
                        toast.dismiss(toastId);
                        toast.success("Writer unblocked successfully");
                      })
                      .catch(() => {
                        toast.error("Failed to undo. Please try again.");
                      });
                  }}
                  className="ml-2 h-auto p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Undo
                </Button>
              </div>,
              {
                autoClose: 8000,
                closeButton: false,
              },
            );
          })
          .catch(() => {
            toast.error("Failed to block writer. Please try again.");
          });
      }
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors">
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
                <span className="text-sm">
                  {note.authorName?.charAt(0) || "A"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-sm">{note.authorName}</p>
                {handle && (
                  <p className="text-xs text-muted-foreground">@{handle}</p>
                )}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onClick={() => {
              if (handle && options.allowAuthorClick) {
                handleAuthorClick(handle);
              }
            }}
            className={cn("cursor-pointer flex flex-row gap-1.5", {
              hidden: !options.allowAuthorClick,
            })}
          >
            <Layers className="w-4 h-4" />
            WriteStack profile
          </DropdownMenuItem>
          {handle && (
            <DropdownMenuItem
              onClick={() => {
                window.open(buildCreatorUrl({ handle }), "_blank");
              }}
              className="cursor-pointer flex flex-row gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              View creator on Substack
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handleBlockWriter}
            className="cursor-pointer flex flex-row gap-1.5 hover:!bg-destructive/10 hover:!text-destructive transition-colors"
          >
            <Ban className="w-4 h-4" />
            Hide creator&apos;s notes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleSelectNote = () => {
    selectNote(note, {
      forceShowEditor: true,
      isFromInspiration: true,
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
            {/* <div className="flex items-center gap-2" /> */}

            {note.createdAt && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
          <div
            className={cn(
              "h-full w-full flex-1 flex flex-col justify-between pb-16",
            )}
          >
            <div className="w-full relative z-20">
              {/* Content */}
              <div
                ref={contentRef}
                className={cn(
                  "w-full relative text-base text-foreground overflow-hidden transition-all duration-200 p-4 pt-0 z-10 min-h-[180px] md:min-h-[200px]",
                  isExpanded ? "max-h-none" : "max-h-[260px]",
                )}
              >
                <div
                  className="absolute inset-0 z-20 cursor-pointer"
                  onClick={handleSelectNote}
                  aria-hidden="true"
                />

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
                  {attachmentImages.map(
                    (attachment, index) =>
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
          {/* {!isFree && ( */}
          <div className="w-full flex items-center justify-between gap-2">
            <Reactions />
            <div
              className={cn("flex items-center justify-between gap-2 px-2", {})}
            >
              <Button
                onClick={() =>
                  window.open(
                    `https://substack.com/@${handle}/note/${entityKey}`,
                    "_blank",
                  )
                }
                variant="link"
                size="sm"
                className={cn(
                  "text-xs text-muted-foreground hover:text-foreground",
                )}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                <span className="hidden md:block">View note on Substack</span>
                <span className="block md:hidden">View on Substack</span>{" "}
              </Button>
            </div>
          </div>
          {/* )} */}
        </div>
      </div>
    </div>
  );
}
