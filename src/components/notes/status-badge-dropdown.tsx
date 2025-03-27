"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { NoteDraft, NoteStatus } from "@/types/note";
import { Check, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { EventTracker } from "@/eventTracker";

const STATUSES: NoteStatus[] = ["draft", "ready", "published"];

type StatusBadgeProps = {
  note: NoteDraft;
  onStatusChange?: (newStatus: NoteStatus) => Promise<void>;
};

const StatusBadgeDropdown = ({ note, onStatusChange }: StatusBadgeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle the dropdown & measure available space
  function toggleDropdown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }

  // Decide whether to open upwards or downwards
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 120; // Height of dropdown content

    setOpenUp(spaceBelow < estimatedHeight && spaceAbove > estimatedHeight);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentStatus = useMemo(() => {
    return note.status;
  }, [note]);

  const handleStatusChange = async (newStatus: NoteStatus) => {
    EventTracker.track("note_status_change_via_status_badge", {
      note_id: note.id,
      previous_status: currentStatus,
      new_status: newStatus,
    });
    if (!onStatusChange || newStatus === currentStatus) return;
    setIsOpen(false);
    let previousStatus = currentStatus;
    setIsLoading(true);
    try {
      await onStatusChange(newStatus);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to change status:", error);
      toast.error("Failed to change status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <Badge
        variant="outline"
        onClick={toggleDropdown}
        className={cn(
          "h-fit text-xs rounded-full !py-0.5 px-4 user-select-none my-auto border cursor-pointer",
          {
            "border-green-500/70 text-green-500": currentStatus === "published",
            "border-gray-500/70 text-gray-500": currentStatus === "draft",
            "border-yellow-500/70 text-yellow-500": currentStatus === "ready",
            "border-red-500/70 text-red-500": note.isArchived,
            "opacity-70": isLoading,
          },
        )}
      >
        {isLoading && (
          <Loader2 className="h-2 w-2 md:h-3 md:w-3 animate-spin mr-0.5 md:mr-1" />
        )}
        <span className="hidden md:block">{currentStatus}</span>
        <span className="block md:hidden">
          {currentStatus.charAt(0).toUpperCase() +
            currentStatus.charAt(1).toLowerCase()}
          .
        </span>
      </Badge>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="status-dropdown"
            initial={{ opacity: 0, y: openUp ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUp ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-[100] w-[fit] shadow-md rounded-md border pr-2",
              "bg-card text-popover-foreground backdrop-blur-sm",
              openUp ? "bottom-full mb-2" : "top-full",
            )}
            onMouseDown={e => e.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="p-1.5 space-y-0.5"
            >
              {STATUSES.map(statusOption => (
                <div
                  key={statusOption}
                  onClick={() => handleStatusChange(statusOption)}
                  className={cn(
                    "flex items-center justify-start gap-2 px-2 py-1.5 rounded-sm text-sm",
                    "transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    {
                      "hover:text-green-500 hover:bg-green-500/10":
                        statusOption === "published",
                      "text-green-500":
                        statusOption === "published" &&
                        statusOption === currentStatus,
                      "hover:text-gray-500 hover:bg-gray-500/10":
                        statusOption === "draft",
                      "text-gray-500":
                        statusOption === "draft" &&
                        statusOption === currentStatus,
                      "hover:text-yellow-500 hover:bg-yellow-500/10":
                        statusOption === "ready",
                      "text-yellow-500":
                        statusOption === "ready" &&
                        statusOption === currentStatus,
                      "text-red-500": note.isArchived,
                      "pointer-events-none":
                        statusOption === currentStatus || isLoading,
                    },
                  )}
                >
                  {/* Show checkmark if selected */}
                  {statusOption === currentStatus && (
                    <Check className="h-4 w-4 mr-0.5 md:mr-1" />
                  )}
                  {statusOption}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusBadgeDropdown;
