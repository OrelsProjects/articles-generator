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
import { CalendarIcon, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, set } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    new Date(note.scheduledTo || new Date()),
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    note.scheduledTo ? format(new Date(note.scheduledTo), "HH:mm") : ""
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const combineDateTime = (): Date | null => {
    if (!selectedTime) return null;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    return set(selectedDate, {
      hours: hours || 0,
      minutes: minutes || 0,
      seconds: 0,
      milliseconds: 0
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value);
  };

  const handleSave = () => {
    const dateTime = combineDateTime();
    if (dateTime) {
      onDateChange(dateTime);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle aria-label="Note" className="text-xl">{note.name || "Note"}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From:</span>
            <span className="font-medium">{note.authorName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Note Body */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="prose max-w-none text-sm leading-relaxed">
              {note.body}
            </div>
          </div>

          {/* Date and Time Selectors */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={date => {
                      if (date) {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="time" className="text-sm font-medium">
                Time:
              </Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={handleTimeChange}
                  className="w-32"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedTime}
          >
            Send Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
