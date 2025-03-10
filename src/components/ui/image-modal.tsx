import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "./button";
import { useNotes } from "@/lib/hooks/useNotes";

export function ImageModal() {
  const { selectedImage, selectImage } = useNotes();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      selectImage(null);
    }
  };

  if (!selectedImage) {
    return null;
  }

  return (
    <Dialog open={!!selectedImage} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-transparent border-none">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 rounded-full bg-background/80 hover:bg-background/90"
            onClick={() => selectImage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="relative w-full max-h-[95vh] flex items-center justify-center">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt}
              width={1920}
              height={1080}
              className="object-contain max-h-[95vh] w-auto"
              priority
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
