import React from "react";
import { format } from "date-fns";
import Image from "next/image";
import { NoteDraft } from "@/types/note";

interface ScheduleNoteRowProps {
  note: NoteDraft;
  onSelect: (note: NoteDraft) => void;
}

export const ScheduleNoteRow = ({ note, onSelect }: ScheduleNoteRowProps) => {
  const hasImage = note.attachments && note.attachments.length > 0;
  const imageUrl = hasImage ? note.attachments![0].url : null;

  return (
    <div 
      className="p-4 mb-2 rounded-md bg-card hover:bg-secondary transition-colors cursor-pointer"
      onClick={() => onSelect(note)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-grow min-w-0">
          <div className="text-muted-foreground mr-4 w-20 flex-shrink-0 pt-0.5">
            {note.scheduledTo && format(new Date(note.scheduledTo), "hh:mm a")}
          </div>
          {note.body && (
            <div className="line-clamp-2 text-foreground flex-grow truncate">
              {note.body}
            </div>
          )}
        </div>
        
        {hasImage && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted relative">
              <Image 
                src={imageUrl || ''}
                alt="Attachment" 
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 