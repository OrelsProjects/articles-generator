"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { NoteDraft } from "@/types/note";
import { useState } from "react";

interface NoteDialogProps {
  note: NoteDraft;
  isOpen: boolean;
  onClose: () => void;
  onDateChange: (date: Date) => void;
}

export function NoteDialog({
  note,
  isOpen,
  onClose,
  onDateChange,
}: NoteDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    note.postDate || new Date(),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{note.name || "Note Details"}</DialogTitle>
          <DialogDescription>Created by {note.authorName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">Body:</p>
            <div className="rounded-md bg-muted p-3">{note.body}</div>
          </div>
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">Change Date:</p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={date => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onDateChange(selectedDate);
              onClose();
            }}
          >
            Update Date
          </Button>
          <Button
            onClick={() => {
              onClose();
            }}
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
