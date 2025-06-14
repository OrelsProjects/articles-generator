"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useOnboarding } from "@/app/providers/OnboardingProvider";

export function InspirationStepPopover() {
  const { next, dismiss, skip } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Find the target element (Inspirations header)
    const findTarget = () => {
      // Look for the Inspirations header text
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      for (const heading of headings) {
        if (heading.textContent?.toLowerCase().includes("inspiration")) {
          return heading as HTMLElement;
        }
      }
      return null;
    };

    const target = findTarget();
    if (target) {
      setTargetElement(target);
      setIsOpen(true);
    } else {
      // If not found immediately, set up observer to watch for DOM changes
      observerRef.current = new MutationObserver(() => {
        const target = findTarget();
        if (target) {
          setTargetElement(target);
          setIsOpen(true);
          observerRef.current?.disconnect();
        }
      });

      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [dismiss]);

  // Apply reduced motion preferences
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!targetElement) {
    return null;
  }

    return (
    <>
      {/* Dark backdrop overlay */}
      <div className="fixed inset-0 bg-black/30 pointer-events-auto z-[9998]" />
      
      <div className="pointer-events-auto relative z-[9999]">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div 
              className="absolute"
              style={{
                top: targetElement.offsetTop,
                left: targetElement.offsetLeft,
                width: targetElement.offsetWidth,
                height: targetElement.offsetHeight,
                pointerEvents: "none",
              }}
            />
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-6 bg-card border shadow-lg pointer-events-auto relative z-[10000]"
            side="bottom"
            align="start"
            sideOffset={8}
          >
                      <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-foreground">
                  Browse Your Inspiration
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={dismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse top notes in your niche, and get inspiration for your next
                note and never run out of ideas.
              </p>

              <div className="flex justify-between gap-2">
                <Button 
                  variant="outline"
                  onClick={skip}
                  className="text-muted-foreground"
                >
                  Skip onboarding
                </Button>
                <Button 
                  variant="default"
                  onClick={next}
                  className="bg-primary hover:bg-primary/90"
                >
                  Got it
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
