import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";

interface TooltipButtonProps extends ButtonProps {
  tooltipContent?: React.ReactNode;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipAlign?: "start" | "center" | "end";
  tooltipDelayDuration?: number;
  className?: string;
  hideTooltip?: boolean;
  forceShowTooltip?: {
    length?: number;
  };
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
      hideTooltip = false,
      className,
      children,
      forceShowTooltip,
      ...props
    },
    ref,
  ) => {

    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
      if (forceShowTooltip?.length) {
        setShowTooltip(forceShowTooltip.length > 0);
      }
      setTimeout(() => {
        setShowTooltip(false);
      }, forceShowTooltip?.length);
    }, [forceShowTooltip]);

    return !tooltipContent ? (
      <Button
        ref={ref}
        className={cn(className)}
        disabled={props.disabled}
        {...props}
      >
        {children}
      </Button>
    ) : (
      <TooltipProvider>
        <Tooltip
          onOpenChange={setShowTooltip}
          delayDuration={tooltipDelayDuration}
          open={showTooltip}
        >
          <TooltipTrigger asChild disabled={hideTooltip}>
            <Button
              ref={ref}
              disabled={props.disabled}
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
          <TooltipContent side={tooltipSide} align={tooltipAlign} className={cn({
            "hidden": hideTooltip
          })}>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

TooltipButton.displayName = "TooltipButton";
