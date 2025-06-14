import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User, FileText, Newspaper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreamingNote } from "@/components/ai-chat/streaming-note";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  userImage?: string | null;
  userName?: string | null;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  userImage,
  userName,
}: MessageBubbleProps) {
  const isUser = role === "user";

  // Detect if content contains note blocks or articles
  const detectContentType = (text: string): "note" | "article" | null => {
    const lowerContent = text.toLowerCase();
    if (text.includes("```note")) {
      return "note";
    }
    if (
      lowerContent.includes("[generated article]") ||
      lowerContent.includes("## article:")
    ) {
      return "article";
    }
    return null;
  };

  const contentType = detectContentType(content);

  // Parse note blocks and other content
  const parseContent = (text: string) => {
    // Split content by note blocks
    const parts = text.split(/(```note[\s\S]*?```)/g);
    const parsed: Array<{ type: "note" | "text"; content: string }> = [];

    parts.forEach(part => {
      if (part.includes("```note")) {
        // Extract note content
        const match = part.match(/```note\n([\s\S]*?)\n```/);
        if (match) {
          parsed.push({ type: "note", content: match[1].trim() });
        }
      } else if (part.trim()) {
        parsed.push({ type: "text", content: part.trim() });
      }
    });

    return parsed;
  };

  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    return text
      .split("\n")
      .map((line, i) => {
        // Handle headers
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="font-bold text-sm mb-1">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="font-bold text-base mb-2">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="font-bold text-lg mb-2">
              {line.slice(2)}
            </h1>
          );
        }

        // Handle lists
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 list-disc">
              {line.slice(2)}
            </li>
          );
        }
        if (/^\d+\. /.test(line)) {
          return (
            <li key={i} className="ml-4 list-decimal">
              {line.replace(/^\d+\. /, "")}
            </li>
          );
        }

        // Handle bold text
        const boldText = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Regular paragraph
        return line ? (
          <p
            key={i}
            className="mb-2 last:mb-0"
            dangerouslySetInnerHTML={{ __html: boldText }}
          />
        ) : (
          <br key={i} />
        );
      })
      .filter(Boolean);
  };

  // Render individual note component
  const renderNote = (noteContent: string, index: number) => (
    <StreamingNote content={noteContent} isComplete />
  );

  // Render content with special handling for notes
  const renderContent = () => {
    if (!isUser && contentType === "note") {
      const parsedContent = parseContent(content);

      return (
        <div className="space-y-4 max-w-full">
          {parsedContent.map((part, index) => {
            if (part.type === "note") {
              return renderNote(part.content, index);
            } else {
              return (
                <div key={index} className="text-sm space-y-1">
                  {formatContent(part.content)}
                </div>
              );
            }
          })}
        </div>
      );
    }

    // Handle articles (legacy format)
    if (!isUser && contentType === "article") {
      const cleanContent = content
        .replace(/\[generated article\]/i, "")
        .replace(/## article:/i, "")
        .trim();

      return (
        <Card className="shadow-sm border-muted/50 max-w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Generated Article
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm space-y-1">
              {formatContent(cleanContent)}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Regular message
    return (
      <div
        className={cn(
          "rounded-2xl px-4 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <div className="text-sm">
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="space-y-1">{formatContent(content)}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4 transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        {isUser ? (
          <>
            <AvatarImage src={userImage || undefined} />
            <AvatarFallback>
              {userName ? (
                userName.charAt(0).toUpperCase()
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[70%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        {renderContent()}

        {timestamp && (
          <span className="text-xs text-muted-foreground px-2">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
