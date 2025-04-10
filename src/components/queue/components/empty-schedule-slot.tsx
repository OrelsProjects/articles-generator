import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface EmptyScheduleSlotProps {
  message?: string;
  time?: string;
  date?: Date;
  id: string;
  onClick: (date: Date) => void;
}

export const EmptyScheduleSlot: React.FC<EmptyScheduleSlotProps> = ({
  message = "Press to create draft",
  time,
  id,
  date,
  onClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "empty-slot",
      time,
    },
  });

  const handleClick = () => {
    debugger;
    // Convert time (HH:MM) AM/PM to date.
    const dateForClick = date ? date : new Date();
    let [hourString, minuteString] = time?.split(":") || ["00", "00"];
    // Minute will have AM/PM, so we need to remove it
    minuteString = minuteString.replace(/[a-zA-Z]/g, "");
    const hour = parseInt(hourString.trim());
    const minute = parseInt(minuteString.trim());
    dateForClick.setHours(hour);
    dateForClick.setMinutes(minute);
    onClick(dateForClick);
  };
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center p-3 mb-2 rounded-md border border-dashed border-border transition-colors cursor-pointer ${
        isOver ? "bg-secondary/40" : "bg-card/40"
      }`}
      onClick={handleClick}
    >
      {time && (
        <div className="text-sm text-muted-foreground min-w-[72px]">{time}</div>
      )}
      <div className="text-sm text-muted-foreground/70 ml-4 flex-grow text-center">
        {message}
      </div>
    </div>
  );
};
