"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StepSlider } from "@/components/ui/step-slider";
import { pricePerTokens } from "@/lib/plans-consts";

interface StepSliderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (credits: number) => void;
  onCancel: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const sliderItems = pricePerTokens.map(item => ({
  value: item.value,
  label: item.label,
}));

export function StepSliderDialog({
  open,
  onOpenChange,
  onContinue,
  onCancel,
  disabled,
  loading,
}: StepSliderDialogProps) {
  const [value, setValue] = React.useState<number | string>(10);

  const price = useMemo(() => {
    return pricePerTokens.find(item => item.value === value)?.price || 99;
  }, [value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <div className="flex items-center justify-center mb-6">
          <DialogTitle aria-label="Add Credits" className="text-xl">
            Add Credits
          </DialogTitle>
        </div>

        <div className="space-y-6">
          {/* Slider Section */}
          <div className="space-y-4">
            <StepSlider
              items={sliderItems}
              value={value}
              onChange={setValue}
              className="mb-8"
            />
          </div>

          {/* Total Section */}
          <div className="flex items-center justify-between py-4 border-t">
            <span className="text-sm font-medium">Total due</span>
            <span className="text-lg font-semibold">${price.toFixed(2)}</span>
          </div>

          {/* Purchase Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => onContinue(value as number)}
            disabled={disabled || loading}
          >
            {loading ? "Purchasing..." : "Purchase"}
          </Button>

          {/* Enable auto top up */}
          {/* <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Enable auto top up
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Configure
            </Button>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
