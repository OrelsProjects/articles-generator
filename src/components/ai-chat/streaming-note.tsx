import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNotes } from "@/lib/hooks/useNotes";
import { NoteDraft } from "@/types/note";
import { selectNotes } from "@/lib/features/notes/notesSlice";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { loadContent, notesTextEditorOptions } from "@/lib/utils/text-editor";

interface StreamingNoteProps {
  content: string;
  isComplete?: boolean;
  className?: string;
}

export function StreamingNote({
  content,
  isComplete = false,
  className,
}: StreamingNoteProps) {
  const { user } = useAppSelector(selectAuth);
  const { createDraftNote, selectNote, sendNote } = useNotes();
  const { thumbnail } = useAppSelector(selectNotes);

  const [displayedContent, setDisplayedContent] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const editor = useEditor(notesTextEditorOptions());

  useEffect(() => {
    if (editor) {
      loadContent(content, editor);
    }
  }, [editor, content]);

  // Animate content appearance
  useEffect(() => {
    setIsVisible(true);
    setDisplayedContent(content);
  }, [content]);

  // Parse note content from ```note blocks
  const parseNoteContent = (text: string) => {
    const noteMatch = text.match(/```note\n([\s\S]*?)(?:\n```|$)/);
    if (noteMatch) {
      return noteMatch[1].trim();
    }
    return text;
  };

  const handleSelectNote = async () => {
    const author = user?.meta?.author;
    debugger;
    const draftNote: NoteDraft = {
      id: "-1",
      body: displayedContent,
      status: "inspiration",
      handle: author?.handle || "@ai",
      thumbnail: author?.photoUrl || thumbnail || "",
      authorId: author?.id || 0,
      authorName: author?.name || "AI",
      createdAt: new Date(),
      wasSentViaSchedule: false,
      attachments: [],
      isArchived: false,
      scheduledTo: null,
    };
    selectNote(draftNote);
  };

  const noteContent = parseNoteContent(displayedContent);

  return (
    <div
      className={cn(
        "flex gap-3 p-4 transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className,
      )}
    >
      {!isComplete && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 max-w-[80%]">
        <div
          className={cn(
            "h-full flex flex-col relative rounded-xl shadow-md border border-border/60 bg-card transition-all duration-200",
            isComplete ? "border-primary/40" : "border-blue-200/50",
          )}
        >
          {/* Header */}
          <div className="w-full flex justify-between items-center border-b border-border/60 p-3">
            <div className="flex items-center gap-2">
              {!isComplete && (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">AI</span>
                </div>
              )}
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Generated Note</span>
              {!isComplete && (
                <div className="flex space-x-1 ml-2">
                  <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                  <div
                    className="w-1 h-1 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <CardContent
            className="p-4 flex-1 cursor-pointer"
            onClick={handleSelectNote}
          >
            <div
              className={cn(
                "text-sm text-foreground leading-relaxed min-h-[120px] transition-all duration-200",
                "whitespace-pre-wrap relative",
              )}
            >
              <div
                className={cn(
                  "transition-opacity duration-200",
                  displayedContent ? "opacity-100" : "opacity-50",
                )}
              >
                {editor && noteContent ? (
                  <EditorContent editor={editor} />
                ) : (
                  noteContent || "Generating your note..."
                )}
              </div>

              {/* Typing cursor */}
              {!isComplete && noteContent && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse"></span>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
