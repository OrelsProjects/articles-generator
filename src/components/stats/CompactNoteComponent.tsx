"use client";

import React, { useEffect, useMemo, useState } from "react";
import { NoteWithEngagementStats } from "@/types/notes-stats";
import {
  Heart,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  MousePointer,
  Users,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { convertMDToHtml, NoteDraft } from "@/types/note";
import { EditorContent, useEditor } from "@tiptap/react";
import { loadContent, notesTextEditorOptions } from "@/lib/utils/text-editor";

interface CompactNoteComponentProps {
  note: NoteWithEngagementStats;
  loading: boolean;
  onNoteClick: (noteDraft: Omit<NoteDraft, "authorId">) => void;
}

export function CompactNoteComponent({
  note,
  loading,
  onNoteClick,
}: CompactNoteComponentProps) {
  const [showMore, setShowMore] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const editor = useEditor(
    notesTextEditorOptions(
      html => {
        setHtmlContent(html);
      },
      {
        disabled: true,
        disabledClass: "opacity-100 text-foreground cursor-pointer",
        onClick: () => {
          onNoteClick({
            id: note.id,
            body: note.body,
            createdAt: note.date,
            authorName: note.name,
            wasSentViaSchedule: false,
            attachments: note.attachments,
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
    });
  }, [note.body, editor]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // const truncateText = (text: string, maxLength: number = 120) => {
  //   if (showMore) return htmlContent;
  // if (text.length <= maxLength) return htmlContent;
  //   return htmlContent?.substring(0, maxLength * 1.5) + "...";
  // };

  const hasShowMore = useMemo(
    () => htmlContent && htmlContent.length > 120,
    [htmlContent, showMore],
  );

  return (
    <div
      className={cn(
        "border border-border/60 rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors",
        {
          "opacity-50": loading,
        },
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
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
        <div className="text-xs text-muted-foreground">
          {new Date(note.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <div className="text-sm text-foreground leading-relaxed">
          <EditorContent disabled editor={editor} />
        </div>
        {hasShowMore && (
          <div className="w-full flex justify-end">
            <Button
              variant="link"
              size="sm"
              className="text-xs hover:text-foreground p-0 h-auto text-primary"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? "Show less" : "Show more"}
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
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
            <span className="text-muted-foreground flex items-center">
              <MousePointer className="h-3 w-3 mr-1" />
              {formatNumber(note.totalClicks)}
            </span>
          )}

          {/* Follows */}
          {note.totalFollows > 0 && (
            <span className="text-muted-foreground flex items-center">
              <UserPlus className="h-3 w-3 mr-1" />
              {formatNumber(note.totalFollows)}
            </span>
          )}

          {/* Subscriptions */}
          {(note.totalPaidSubscriptions > 0 ||
            note.totalFreeSubscriptions > 0) && (
            <span className="text-muted-foreground flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {formatNumber(
                note.totalPaidSubscriptions + note.totalFreeSubscriptions,
              )}
            </span>
          )}
        </div>
      </div>

      {/* External Link */}
      <div className="flex justify-end mt-2">
        <Button
          onClick={() => {
            const commentIdWithCDash = `c-${note.id.replace("c-", "")}`;
            window.open(
              `https://substack.com/@${note.handle}/note/${commentIdWithCDash}`,
              "_blank",
            );
          }}
          variant="link"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
        >
          View on Substack <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
