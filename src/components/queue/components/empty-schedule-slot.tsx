import React from "react";

interface EmptyScheduleSlotProps {
  message: string;
}

export const EmptyScheduleSlot = ({ message }: EmptyScheduleSlotProps) => (
  <div className="p-4 mb-2 rounded-md bg-muted/40 border border-dashed border-border text-center text-muted-foreground">
    <span className="text-sm italic">{message}</span>
  </div>
); 