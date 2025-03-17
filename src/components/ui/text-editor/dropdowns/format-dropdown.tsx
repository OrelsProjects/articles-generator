import React, { useState, useRef, useEffect, useMemo } from "react";
import { Editor } from "@tiptap/react";
import { Loader2, Sparkles, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImprovementType } from "@/lib/prompts";
import { MotionTooltipButton } from "@/components/ui/motion-components";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectSettings } from "@/lib/features/settings/settingsSlice";
import { INFINITY } from "@/lib/plans-consts";
import { useSettings } from "@/lib/hooks/useSettings";
import { Textarea } from "@/components/ui/textarea";

// React node with onClick
type Trigger = React.ReactElement & { onClick?: () => void };

export type FormatOption = {
  label: string;
  icon: React.ElementType;
  divider?: boolean;
  subLabel?: string;
  type: string | ImprovementType;
  tooltip?: string;
  action?: "text";
};

interface FormatDropdownProps {
  options: FormatOption[];
  loading?: string | null;
  onSelect: (type: string, text?: string) => void;
  trigger?: Trigger;
  disabled?: boolean;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  error?: { text: string; disabled: boolean };
  type: "title-subtitle" | "text";
}

export function FormatDropdown({
  options,
  onSelect,
  loading,
  trigger,
  disabled,
  className,
  error,
  onMouseEnter,
  onMouseLeave,
  type,
}: FormatDropdownProps) {
  const { credits } = useAppSelector(selectSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
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
    const estimatedHeight = 240;

    setOpenUp(spaceBelow < estimatedHeight && spaceAbove > estimatedHeight);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setExpandedOption(null);
        setTextInput("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOptionClick = (option: FormatOption) => {
    if (option.action === "text") {
      setExpandedOption(String(option.type));
    } else {
      onSelect(String(option.type));
      setIsOpen(false);
    }
  };

  const handleSend = () => {
    if (expandedOption && textInput.trim()) {
      onSelect(expandedOption, textInput.trim());
      setTextInput("");
      setExpandedOption(null);
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setExpandedOption(null);
    setTextInput("");
  };

  const usedCount = useMemo(() => {
    return credits.remaining;
  }, [credits]);

  const maxCount = useMemo(() => {
    return credits.total;
  }, [credits]);

  const usageLabel = useMemo(() => {
    if (maxCount === INFINITY) {
      return <p className="p-1.5 text-xs text-primary">Unlimited usage</p>;
    }
    return (
      <p className="p-1.5 text-xs text-muted-foreground">
        {usedCount}/{maxCount}
      </p>
    );
  }, [usedCount, maxCount]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {trigger ? (
        React.cloneElement(trigger as React.ReactElement, {
          onClick: toggleDropdown,
        })
      ) : (
        <Button
          onMouseDown={e => e.preventDefault()}
          onClick={toggleDropdown}
          variant="ghost"
          disabled={disabled}
        >
          <Sparkles className="h-5 w-5" />
          <span className="ml-2">Ask AI</span>
        </Button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="format-dropdown"
            initial={{ opacity: 0, y: openUp ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUp ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 w-40 shadow-md transition-none",
              expandedOption ? "w-64" : "w-40",
              "bg-popover text-popover-foreground backdrop-blur-sm",
              openUp ? "bottom-full mb-2" : "top-full mt-2",
            )}
            onMouseDown={e => e.preventDefault()}
            style={{ maxHeight: "28vh", overflowY: "auto" }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="p-1.5 space-y-0.5"
            >
              {error?.text && (
                <p className="p-1.5 text-xs text-red-500">{error.text}</p>
              )}
              {options.map(option => (
                <div key={option.label}>
                  {option.subLabel && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      {option.subLabel}
                    </p>
                  )}

                  {expandedOption === option.type ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-2 space-y-2"
                    >
                      <Textarea
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        placeholder="Enter your text..."
                        className="min-h-[80px] max-h-[200px] resize-none"
                        autoFocus
                        maxLength={1000}
                      />
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClose}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSend}
                          disabled={!textInput.trim()}
                          className="h-8 w-8 p-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <MotionTooltipButton
                      variant={"ghost"}
                      tooltipContent={option.tooltip}
                      onClick={() => handleOptionClick(option)}
                      disabled={disabled || error?.disabled}
                      className={cn(
                        "w-full flex items-center justify-start gap-2 px-2 py-1.5 rounded-sm text-sm",
                        "transition-colors hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {loading === option.type ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <option.icon className="h-4 w-4" />
                      )}
                      <span>{option.label}</span>
                    </MotionTooltipButton>
                  )}

                  {option.divider && <div className="h-px bg-border my-1" />}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
