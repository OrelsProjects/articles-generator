"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { NoteWithEngagementStats } from "@/types/notes-stats";
import {
  Heart,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  MousePointer,
  Users,
  BadgeDollarSign,
  MoreVertical,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  convertMDToHtml,
  NoteDraft,
  noteWithEngagementStatsToNoteDraft,
} from "@/types/note";
import { EditorContent, useEditor } from "@tiptap/react";
import { loadContent, notesTextEditorOptions } from "@/lib/utils/text-editor";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildNoteUrl } from "@/lib/utils/note";
import { useNotes } from "@/lib/hooks/useNotes";

interface CompactNoteComponentProps {
  note: NoteWithEngagementStats;
  loading: boolean;
  className?: string;
  onNoteClick?: (noteDraft: Omit<NoteDraft, "authorId">) => void;
}

const TooltipStat = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild className="cursor-default">
          {children}
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function CompactNoteComponent({
  note,
  loading,
  onNoteClick,
}: CompactNoteComponentProps) {
  const [showMore, setShowMore] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasShowMore, setHasShowMore] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const { selectNote } = useNotes();

  const editor = useEditor(
    notesTextEditorOptions(
      html => {
        setHtmlContent(html);
      },
      {
        disabled: true,
        disabledClass: "opacity-100 text-foreground cursor-pointer",
        onClick: () => {
          onNoteClick?.({
            id: note.id,
            body: note.body,
            createdAt: note.date,
            authorName: note.name,
            wasSentViaSchedule: false,
            attachments: note.attachments,
            thumbnail: note.photoUrl,
            status: "inspiration",
          });
        },
      },
    ),
  );

  useEffect(() => {
    if (!editor) return;
    convertMDToHtml(note.body).then(html => {
      loadContent(html, editor);
      setHtmlContent(html);
    });
  }, [note.body, editor]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };
  // Once the HTML is loaded, measure to see if it exceeds 260px
  useEffect(() => {
    if (contentRef.current) {
      requestAnimationFrame(() => {
        const height = contentRef.current?.scrollHeight || 999;
        setHasShowMore(height > 260);
      });
    }
  }, [htmlContent]);

  return (
    <div
      className={cn(
        "h-full flex flex-col gap-4 border border-border/60 rounded-lg p-3 bg-card transition-colors overflow-hidden",
        {
          "opacity-50": loading,
        },
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
            {note.photoUrl ? (
              <Image
                src={note.photoUrl}
                alt={note.name || "Author"}
                width={24}
                height={24}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-xs">{note.name?.charAt(0) || "A"}</span>
            )}
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm">{note.name}</p>
            {note.handle && (
              <p className="text-xs text-muted-foreground">@{note.handle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {new Date(note.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  window.open(
                    buildNoteUrl({
                      handle: note.handle,
                      noteId: note.commentId,
                      isComment: true,
                    }),
                    "_blank",
                  );
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                <span className="hidden md:block">View note on Substack</span>
                <span className="block md:hidden">View on Substack</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          "overflow-hidden relative cursor-pointer",
          showMore ? "max-h-none" : "max-h-[260px]",
        )}
        onClick={() => {
          
          const noteDraft = noteWithEngagementStatsToNoteDraft(note);
          selectNote(noteDraft, {
            isFromInspiration: true,
          });
        }}
      >
        <div className="text-sm text-foreground leading-relaxed">
          <EditorContent disabled editor={editor} />
        </div>
      </div>
      {hasShowMore && (
        <div className="relative h-4 w-full z-20">
          <Button
            variant="link"
            onClick={() => setShowMore(!showMore)}
            className="absolute -bottom-4 right-0 text-xs text-primary hover:underline focus:outline-none mt-1 block ml-auto"
          >
            {showMore ? "Show less" : "Show more"}
          </Button>
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent -z-10",
              showMore ? "opacity-0" : "opacity-100",
            )}
          />
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs mt-auto">
        <div className="flex items-center gap-3">
          {/* Reactions */}
          <span className="text-muted-foreground flex items-center">
            <Heart className="h-3 w-3 mr-1 text-red-500 fill-red-500" />
            {formatNumber(note.reactionCount)}
          </span>

          {/* Comments */}
          <span className="text-muted-foreground flex items-center">
            <MessageCircle className="h-3 w-3 mr-1" />
            {formatNumber(note.commentsCount || 0)}
          </span>

          {/* Restacks */}
          <span className="text-muted-foreground flex items-center">
            <RefreshCw className="h-3 w-3 mr-1" />
            {formatNumber(note.restacks)}
          </span>
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center gap-3">
          {/* Clicks */}
          {note.totalClicks > 0 && (
            <TooltipStat tooltip="Clicks">
              <span className="text-muted-foreground flex items-center">
                <MousePointer className="h-3 w-3 mr-1" />
                {formatNumber(note.totalClicks)}
              </span>
            </TooltipStat>
          )}

          {/* Subscriptions */}
          {note.totalFreeSubscriptions > 0 && (
            <TooltipStat tooltip="Free subscriptions">
              <span className="text-muted-foreground flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {formatNumber(note.totalFreeSubscriptions)}
              </span>
            </TooltipStat>
          )}
          {note.totalPaidSubscriptions > 0 && (
            <TooltipStat tooltip="Paid subscriptions">
              <span className="text-muted-foreground flex items-center">
                <BadgeDollarSign className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                {formatNumber(note.totalPaidSubscriptions)}
              </span>
            </TooltipStat>
          )}
        </div>
      </div>
    </div>
  );
}
