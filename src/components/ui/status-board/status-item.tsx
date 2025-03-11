"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Pencil } from "lucide-react";
import type { StatusItem as StatusItemType } from "./types";
import { Button } from "@/components/ui/button";
import { UniqueIdentifier } from "@dnd-kit/core";
interface StatusItemProps {
  item: StatusItemType;
  onEditItem: (itemId: UniqueIdentifier, content: string) => void;
  selected: boolean;
}

export function StatusItem({ item, onEditItem, selected }: StatusItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "z-10" : ""} cursor-pointer active:cursor-grabbing ${selected ? "border-primary/60" : ""}`}
      onClick={e => {
        e.stopPropagation();
        onEditItem(item.id, item.content);
      }}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={item.avatar} alt={item.author || "User"} />
            <AvatarFallback>
              {(item.author?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {item.author && (
              <div className="font-medium text-sm">{item.author}</div>
            )}
            <div className="text-sm break-words">{item.content}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
