"use client";

import { Pencil, X } from "lucide-react";
import Image from "next/image";
import { useRef, useCallback, useState } from "react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { NoteDraftImage } from "@/types/note";

interface NoteImageContainerProps {
  imageUrl?: string | null;
  onImageSelect?: (files: File[]) => void;
  onImageDelete?: (attachment: NoteDraftImage) => void;
  attachment?: NoteDraftImage;
  disabled?: boolean;
  allowDelete?: boolean;
}

export function NoteImageContainer({
  imageUrl,
  onImageSelect,
  onImageDelete,
  attachment,
  disabled = false,
  allowDelete = true,
}: NoteImageContainerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files) {
        onImageSelect?.(files);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [onImageSelect],
  );

  const handleEditClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.target as HTMLImageElement;
      const aspectRatio = img.naturalWidth / img.naturalHeight;

      // Maximum dimensions
      const maxWidth = 180;
      const maxHeight = 96;

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // Scale down if needed while maintaining aspect ratio
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      setImageDimensions({ width, height });
    },
    [],
  );

  const containerStyle = imageDimensions
    ? {
        width: `${imageDimensions.width}px`,
        height: `${imageDimensions.height}px`,
      }
    : {
        width: "180px",
        height: "96px",
      };

  return (
    <div
      className="relative group rounded-md overflow-hidden border border-border/40"
      style={containerStyle}
    >
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt="Note image"
            width={180}
            height={140}
            className="object-contain w-full h-full"
            onLoad={handleImageLoad}
          />
          {onImageDelete && allowDelete && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <TooltipButton
                tooltipContent="Remove image"
                variant="ghost"
                size="sm"
                className="h-8 w-8 bg-background/20 hover:bg-background/40 rounded-lg px-0"
                onClick={() => attachment && onImageDelete?.(attachment)}
                disabled={disabled}
              >
                <X className="h-6 w-6 text-white" />
              </TooltipButton>
            </div>
          )}
        </>
      ) : (
        <button
          className="w-full h-full flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors"
          onClick={handleEditClick}
          disabled={disabled}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />
    </div>
  );
}
