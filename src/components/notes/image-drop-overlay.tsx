"use client";

import { ArrowDown, TriangleAlert } from "lucide-react";
import { useCallback } from "react";

interface ImageDropOverlayProps {
  isVisible: boolean;
  onFileDrop: (files: File[]) => void;
  onHide: () => void;
  disabled?: boolean;
  maxAttachments: number;
}

export function ImageDropOverlay({
  isVisible,
  onFileDrop,
  disabled = false,
  onHide,
  maxAttachments,
}: ImageDropOverlayProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) {
        onHide();
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        onFileDrop(imageFiles);
      } else {
        onHide();
      }
    },
    [onFileDrop, disabled, onHide],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/60"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {disabled ? (
        <>
          <div className="p-6 rounded-full bg-background/80 flex items-center justify-center mb-4">
            <TriangleAlert className="h-10 w-10 text-primary/80" />
          </div>
          <p className="text-lg font-medium text-foreground">
            Only {maxAttachments} images are allowed
          </p>
        </>
      ) : (
        <>
          <div className="p-6 rounded-full bg-background/80 flex items-center justify-center mb-4">
            <ArrowDown className="h-10 w-10 text-primary/80" />
          </div>
          <p className="text-lg font-medium text-foreground">
            Drop image here to upload
          </p>
        </>
      )}
    </div>
  );
}

export default ImageDropOverlay;
