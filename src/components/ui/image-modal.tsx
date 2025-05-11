"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { useNotes } from "@/lib/hooks/useNotes";

export function ImageModal() {
  const { selectedImage, selectImage } = useNotes();

  const handleOpenChange = (open: boolean) => {
    ;
    if (!open) {
      selectImage(null);
    }
  };

  if (!selectedImage) {
    return null;
  }
  console.log("selectedImage", selectedImage);
  return (
    <Dialog open={!!selectedImage} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 overflow-hidden bg-transparent border-none">
        <div className="relative z-[9999]">
          <div className="relative w-full max-h-[95vh] flex items-center justify-center">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt}
              fill
              className="!relative object-contain max-h-[95vh] w-auto"
              priority
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
