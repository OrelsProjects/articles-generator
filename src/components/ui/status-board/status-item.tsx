"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StatusItem as StatusItemType } from "./types";
import { UniqueIdentifier } from "@dnd-kit/core";
import { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import StatusBadgeDropdown from "@/components/notes/status-badge-dropdown";
import { formatText } from "@/lib/utils/text-editor";
import { ImageIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NoteStatus } from "@prisma/client";
interface StatusItemProps {
  item: StatusItemType;
  onSelectItem: (itemId: UniqueIdentifier, content: string) => void;
  selected: boolean;
}

export function StatusItem({ item, onSelectItem, selected }: StatusItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
    userSelect: "none",
  };

  const Body = ({ text }: { text: string }) => {
    const formattedText = formatText(text);
    return (
      <div
        className="prose prose-sm max-w-none note-component-content"
        dangerouslySetInnerHTML={{
          __html: formattedText,
        }}
      />
    );
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer active:cursor-grabbing relative",
        isDragging ? "z-10" : "",
        selected ? "border-primary/60" : "",
        "touch-none",
      )}
      onClick={e => {
        e.stopPropagation();
        onSelectItem(item.id, item.content);
      }}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 relative">
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={item.avatar} alt={item.author || "User"} />
            <AvatarFallback>
              {(item.author?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2.5">
            {item.author && (
              <div className="w-full flex justify-between">
                <div className="font-medium text-sm pt-1.5">{item.author}</div>
                <div className="flex flex-col items-end gap-1">
                  {item.noteDraft && item.status === "scheduled" && (
                    <StatusBadgeDropdown
                      status={item.noteDraft.status as NoteStatus}
                      scheduledTo={item.noteDraft.scheduledTo}
                    />
                  )}
                  {item.hasAttachment && (
                    <TooltipProvider>
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger>
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Note has an image</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )}
            <Body text={item.content} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
