import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TooltipButtonProps extends ButtonProps {
  tooltipContent: React.ReactNode;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipAlign?: "start" | "center" | "end";
  tooltipDelayDuration?: number;
  className?: string;
  children: React.ReactNode;
}

export const TooltipButton = React.forwardRef<
  HTMLButtonElement,
  TooltipButtonProps
>(
  (
    {
      tooltipContent,
      tooltipSide = "top",
      tooltipAlign = "center",
      tooltipDelayDuration = 100,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={tooltipDelayDuration}>
          <TooltipTrigger asChild>
            <Button
              ref={ref}
              className={cn("", className)}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                if (props.disabled) {
                  return;
                }
                props.onClick?.(e);
              }}
              {...props}
            >
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} align={tooltipAlign}>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

TooltipButton.displayName = "TooltipButton";
