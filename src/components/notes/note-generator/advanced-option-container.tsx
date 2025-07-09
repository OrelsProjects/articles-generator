import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export interface AdvancedOptionContainerProps {
  enabled: boolean;
  label: string;
  onEnabledChange: (enabled: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function AdvancedOptionContainer({
  enabled,
  label,
  onEnabledChange,
  children,
  className,
}: AdvancedOptionContainerProps) {
  const [didEnableChange, setDidEnableChange] = useState(false);

  const handleEnabledChange = (enabled: boolean) => {
    setDidEnableChange(true);
    onEnabledChange(enabled);
    if (!enabled) {
      setTimeout(() => {
        setDidEnableChange(false);
      }, 100);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="note-length"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
        />
        <Label
          htmlFor="note-length"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </Label>
      </div>
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={
              didEnableChange ? { opacity: 0, y: 10, height: 0 } : undefined
            }
            animate={
              didEnableChange ? { opacity: 1, y: 0, height: "auto" } : undefined
            }
            exit={
              didEnableChange ? { opacity: 0, y: -10, height: 0 } : undefined
            }
            transition={didEnableChange ? { duration: 0.1 } : undefined}
            className={cn("space-y-3 pl-6", className)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
