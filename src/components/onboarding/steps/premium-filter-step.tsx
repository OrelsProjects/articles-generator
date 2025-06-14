"use client";

import React, { useEffect, useState, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useOnboarding } from "@/app/providers/OnboardingProvider";

export function PremiumFilterStepPopover() {
  const { next, dismiss, skip } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Find the filter button - look for buttons with "Filter" text or filter icon
    const findTarget = () => {
      // Look for buttons that contain "Filter" text
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('filter') || button.querySelector('[data-testid*="filter"]')) {
          return button as HTMLElement;
        }
      }
      
      // Also look for elements with filter-related classes
      const filterElements = document.querySelectorAll('[class*="filter"], [data-testid*="filter"]');
      if (filterElements.length > 0) {
        return filterElements[0] as HTMLElement;
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
        subtree: true
      });
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dismiss]);

  if (!targetElement) {
    return null;
  }

  return (
    <>
      {/* Dark backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto z-[9998]" />
      
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
                pointerEvents: 'none'
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
                  Advanced Filters
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
                Use advanced filters to surface your highest-impact ideas fast.
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
                  Next
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
} 