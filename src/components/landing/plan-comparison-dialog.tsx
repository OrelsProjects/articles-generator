"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle } from "lucide-react";
import { FeatureFlag, Plan } from "@prisma/client";
import { featureFlagsPerPlan } from "@/lib/plans-consts";
import { cn } from "@/lib/utils";

// Map feature flags to user-friendly descriptions
const featureFlagLabels: Record<FeatureFlag, string> = {
  advancedGPT: "Choose your LLM (Includes GPT-4.5)",
  articles: "Access to The Best Notes Templates",
  advancedFiltering: "Advanced Notes Research Tools",
  instantPost: "Easy one-click posting",
  populateNotes: "Automatic notes population",
  collaborativeNotes: "Collaborative note editing",
  initQueue: "Note queue initialization",
  scheduleNotes: "Schedule notes",
  canViewWriters: "Access to Writers",
  canUseRadar: "Access to Radar",
  canAutoDM: "Access to Auto DM",
  chat: "Access to Chat",
};

interface PlanComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: Plan | null;
  targetPlan: Plan;
  onConfirm: () => void;
  loading?: boolean;
}

export default function PlanComparisonDialog({
  open,
  onOpenChange,
  currentPlan,
  targetPlan,
  onConfirm,
  loading = false,
}: PlanComparisonDialogProps) {
  if (!currentPlan) {
    return null;
  }

  const isUpgrade =
    (currentPlan === "hobbyist" &&
      (targetPlan === "standard" || targetPlan === "premium")) ||
    (currentPlan === "standard" && targetPlan === "premium");

  const isDowngrade =
    (currentPlan === "premium" &&
      (targetPlan === "standard" || targetPlan === "hobbyist")) ||
    (currentPlan === "standard" && targetPlan === "hobbyist");

  const currentFeatures = featureFlagsPerPlan[currentPlan] || [];
  const targetFeatures = featureFlagsPerPlan[targetPlan] || [];

  // Features that will be lost (only present in current plan but not in target plan)
  const featuresToLose = currentFeatures.filter(
    feature => !targetFeatures.includes(feature),
  );

  // Features that will be gained (only present in target plan but not in current plan)
  const featuresToGain = targetFeatures.filter(
    feature => !currentFeatures.includes(feature),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isUpgrade
              ? "Upgrade Your Plan"
              : isDowngrade
                ? "Downgrade Your Plan"
                : "Change Your Plan"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "px-3 py-1 border rounded-md",
                isUpgrade
                  ? "bg-muted/10 border-muted-foreground/20 text-foreground/90"
                  : isDowngrade
                    ? "bg-primary/5 border-primary/30 text-primary font-bold"
                    : "",
              )}
            >
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </div>
            <span className="text-sm text-muted-foreground">→</span>
            <div
              className={cn(
                "px-3 py-1 border rounded-md",
                isDowngrade
                  ? "bg-muted/10 border-muted-foreground/20 text-foreground/90"
                  : isUpgrade
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
                    : "",
              )}
            >
              {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
            </div>
          </div>

          {featuresToLose.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-medium flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-4 w-4" />
                Features you&apos;ll lose
              </h3>
              <ul className="space-y-2">
                {featuresToLose.map(feature => (
                  <li key={feature} className="flex items-start gap-2">
                    <X className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {featureFlagLabels[feature] || feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {featuresToGain.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-medium flex items-center gap-2 text-primary">
                <Check className="h-4 w-4" />
                Features you&apos;ll gain
              </h3>
              <ul className="space-y-2">
                {featuresToGain.map(feature => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {featureFlagLabels[feature] || feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {featuresToGain.length === 0 && featuresToLose.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                No feature changes between these plans.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                isUpgrade
                  ? "bg-primary hover:bg-primary/90"
                  : isDowngrade
                    ? "bg-red-500 hover:bg-red-600"
                    : "",
              )}
            >
              {loading
                ? "Processing..."
                : isUpgrade
                  ? "Upgrade Now"
                  : isDowngrade
                    ? "Downgrade"
                    : "Change Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
