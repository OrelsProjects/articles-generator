"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { NoteStatus } from "@/types/note";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type StatusBadgeProps = {
  status: NoteStatus;
  scheduledTo?: Date | null;
  isArchived?: boolean;
};

const StatusBadgeDropdown = ({
  status,
  scheduledTo,
  isArchived,
}: StatusBadgeProps) => {
  const currentStatusText = useMemo(() => {
    if (scheduledTo && status === "scheduled") {
      // return DD/MM, HH:MM (24h format)
      return format(scheduledTo, "dd/MM, HH:mm");
    }
    return status;
  }, [scheduledTo, status]);

  return (
    <div className="relative inline-block">
      <Badge
        variant="outline"
        // onClick={toggleDropdown}
        className={cn(
          "h-fit text-xs rounded-full !py-0.5 px-4 user-select-none my-auto border opacity-80",
          {
            "border-green-500/70 !text-green-500 dark:border-green-400/70 dark:!text-green-400":
              status === "published",
            "border-gray-500/70 !text-gray-500 dark:border-gray-400/70 dark:!text-gray-400":
              status === "draft",
            "border-yellow-500/70 !text-yellow-500 dark:border-yellow-400/70 dark:!text-yellow-400":
              status === "scheduled",
            "border-red-500/70 !text-red-500 dark:border-red-400/70 dark:!text-red-400":
              isArchived,
          },
        )}
      >
        <span>{currentStatusText}</span>
      </Badge>
    </div>
  );
};

export default StatusBadgeDropdown;
