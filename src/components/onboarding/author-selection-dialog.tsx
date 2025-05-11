"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Byline } from "@/types/article";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuthorSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bylines: Byline[];
  onSelect: (byline: Byline) => void;
}

export function AuthorSelectionDialog({
  open,
  onOpenChange,
  bylines,
  onSelect,
}: AuthorSelectionDialogProps) {
  const isSingleByline = bylines.length === 1;
  const singleByline = isSingleByline ? bylines[0] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" closeOnOutsideClick={false}>
        <DialogHeader>
          <DialogTitle
            aria-label={isSingleByline ? "Is it you?" : "Who are you?"}
          >
            {isSingleByline ? "Is it you?" : "Who are you?"}
          </DialogTitle>
        </DialogHeader>
        {isSingleByline && singleByline ? (
          <div className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={singleByline.photoUrl}
                alt={singleByline.name}
              />
              <AvatarFallback>
                {singleByline.name
                  .split(" ")
                  .map(n => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div>
                <h4 className="font-medium">{singleByline.name}</h4>
                <p className="text-sm text-muted-foreground">
                  @{singleByline.handle}
                </p>
              </div>
              {singleByline.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {singleByline.bio}
                </p>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px] pr-4">
            <div className="w-full space-y-4">
              {bylines?.map(byline => (
                <div
                  key={byline.authorId}
                  className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onSelect(byline)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={byline.photoUrl} alt={byline.name} />
                    <AvatarFallback>
                      {byline.name
                        .split(" ")
                        .map(n => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{byline.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          @{byline.handle}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="hidden md:block"
                        onClick={() => onSelect(byline)}
                      >
                        Select
                      </Button>
                    </div>
                    {byline.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {byline.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {isSingleByline && (
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              No, it&apos;s not me
            </Button>
            <Button onClick={() => onSelect(singleByline!)}>
              Yes, it&apos;s me
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
