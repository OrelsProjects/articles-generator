import React, { useState, useRef, useEffect, useMemo } from "react";
import { Editor } from "@tiptap/react";
import {
  Sparkles,
  Languages,
  MessageSquareText,
  MoreHorizontal,
  FileText,
  Smile,
  ThumbsUp,
  Wand2,
  Zap,
  ScanText,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImprovementType } from "@/lib/prompts";
import { getSelectedContentAsMarkdown } from "@/lib/utils/text-editor";

const MotionButton = motion(Button);

interface FormatDropdownProps {
  editor: Editor | null;
  loading: ImprovementType | null;
  onImprove: (type: ImprovementType) => any;
  maxCharacters: number;
}

const formatOptions: {
  label: string;
  icon: React.ElementType;
  divider?: boolean;
  subLabel?: string;
  type: ImprovementType;
}[] = [
  {
    type: "elaborate",
    label: "Elaborate",
    subLabel: "Make it more",
    icon: Sparkles,
    divider: false,
  },
  {
    type: "engaging",
    label: "Engaging",
    icon: MessageSquare,
    subLabel: "Make it more",
    divider: false,
  },
  {
    type: "humorous",
    label: "Humorous",
    icon: Smile,
    divider: false,
  },
  {
    type: "positive",
    label: "Positive",
    icon: ThumbsUp,
    divider: false,
  },
  {
    type: "creative",
    label: "Creative",
    icon: Wand2,
    divider: false,
  },
  {
    type: "sarcastic",
    label: "Sarcastic",
    icon: MessageSquare,
    divider: false,
  },
  {
    type: "inspirational",
    label: "Inspirational",
    icon: Zap,
    divider: false,
  },
  {
    type: "concise",
    label: "Concise",
    icon: FileText,
    divider: false,
  },
];

export function FormatDropdown({
  editor,
  onImprove,
  loading,
  maxCharacters = 1500,
  ...props
}: FormatDropdownProps) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle the dropdown & measure available space
  function toggleDropdown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Keep Tiptap focused
    editor?.chain().focus().run();
    setOpen(prev => !prev);
  }

  // Decide whether to open upwards or downwards based on available space
  useEffect(() => {
    if (!open) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Suppose we want a rough guess that the dropdown might be 200px tall
    // (or measure the actual content size if you prefer).
    const estimatedHeight = 240; // tweak as needed

    // If there's not enough space below but enough space above, open upwards
    if (spaceBelow < estimatedHeight && spaceAbove > estimatedHeight) {
      setOpenUp(true);
    } else {
      setOpenUp(false);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      // If the click is outside our container
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const error = () => {
    if (!editor) return { text: "", disabled: false };
    const text = getSelectedContentAsMarkdown(editor);
    if (text.length > maxCharacters) {
      return {
        text: "Text is too long",
        disabled: true,
      };
    }
    return { text: "", disabled: false };
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger Button */}
      <Button
        onMouseDown={e => {
          // Hack so Tiptap doesn't lose the selection
          e.preventDefault();
        }}
        onClick={toggleDropdown}
        variant="ghost"
      >
        <Sparkles className="h-5 w-5" /> <span className="ml-2">Ask AI</span>
      </Button>

      {/* The dropdown itself */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="format-dropdown"
            initial={{ opacity: 0, y: openUp ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUp ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 w-56 rounded-md border border-border shadow-md",
              "bg-popover text-popover-foreground backdrop-blur-sm",
              openUp ? "bottom-full mb-2" : "top-full mt-2",
            )}
            // Keep Tiptap from losing focus if user clicks inside
            onMouseDown={e => e.preventDefault()}
            // Constrain height & scroll
            style={{ maxHeight: "30vh", overflowY: "auto" }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="p-1.5 space-y-0.5"
            >
              {error().text && (
                <p className="p-1.5 text-xs text-red-500">{error().text}</p>
              )}
              {formatOptions.map(option => {
                return (
                  <div key={option.label}>
                    {option.subLabel && (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        {option.subLabel}
                      </p>
                    )}

                    <MotionButton
                      variant="ghost"
                      onClick={() => onImprove(option.type)}
                      disabled={!!loading || error().disabled}
                      className={cn(
                        "w-full flex items-center justify-start gap-2 px-2 py-1.5 rounded-sm text-sm",
                        "transition-colors hover:text-accent-foreground",
                      )}
                    >
                      {loading === option.type ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <option.icon className="h-4 w-4" />
                      )}
                      <span>{option.label}</span>
                    </MotionButton>

                    {option.divider && <div className="h-px bg-border my-1" />}
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
