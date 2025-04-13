"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { useNotesSchedule } from "@/lib/hooks/useNotesSchedule";
interface NoSubstackCookiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  loading: boolean;
}

export function NoSubstackCookiesDialog({
  open,
  onOpenChange,

  onCancel,
  loading,
}: NoSubstackCookiesDialogProps) {
  const { initCanUserScheduleInterval } = useNotesSchedule();
  const handleSubstackLogin = () => {
    initCanUserScheduleInterval()
      ?.then(() => {
        onOpenChange(false);
      })
      .catch(() => {
        toast.error("Didn't find any Substack login. Try again please.");
      });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle aria-label="Substack login required">
            Substack login required
          </DialogTitle>
          <DialogDescription>
            To continue with scheduling, you need to make sure you are logged in
            to Substack (It appears you are not).
            <br />
            Quickly open Substack, make sure you are logged in, and then come
            back here.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between sm:justify-between mt-4">
          <Button variant="outline" onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button variant="default" asChild disabled={loading}>
            <Link
              href="https://www.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSubstackLogin}
              className={cn({
                "opacity-50 pointer-events-none cursor-wait": loading,
              })}
            >
              {loading ? "Verifying..." : "Go to Substack"}
              <ExternalLinkIcon className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NoSubstackCookiesDialog;
