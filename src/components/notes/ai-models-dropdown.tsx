"use client";

import { useState } from "react";
import { useUi } from "@/lib/hooks/useUi";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FrontendModel =
  | "auto"
  | "gpt-4.5"
  | "claude-3.5"
  | "claude-3.7"
  | "claude-3.5-haiku"
  | "claude-sonnet-4"
  // | "gemini-2.5-pro"
  | "grok-3-beta"
  | "gpt-4.1";
// Define AI models
const AI_MODELS: {
  value: FrontendModel;
  label: string;
  shortName: string;
  recommended?: boolean;
}[] = [
  { value: "auto", label: "Auto", shortName: "auto", recommended: true },
  { value: "gpt-4.5", label: "GPT-4.5", shortName: "o4.5" },
  { value: "gpt-4.1", label: "GPT-4.1", shortName: "o4.1" },
  { value: "claude-sonnet-4", label: "Claude Sonnet 4", shortName: "c4" },
  // {
  //   value: "gemini-2.5-pro",
  //   label: "Gemini 2.5 Pro",
  //   shortName: "g2.5",
  // },
  { value: "claude-3.5", label: "Claude 3.5", shortName: "c3.5" },
  { value: "claude-3.7", label: "Claude 3.7", shortName: "c3.7" },
  { value: "claude-3.5-haiku", label: "Claude Haiku 3.5", shortName: "c3.5h" },
  { value: "grok-3-beta", label: "Grok 3 Beta", shortName: "grok3" },
];

interface AiModelsDropdownProps {
  onModelChange: (model: FrontendModel) => void;
  className?: string;
  classNameTrigger?: string;
  size?: "sm" | "md";
}

export function AiModelsDropdown({
  onModelChange,
  className,
  classNameTrigger,
  size = "sm",
}: AiModelsDropdownProps) {
  const [selectedModel, setSelectedModel] = useState<FrontendModel>("auto");

  const { hasAdvancedGPT } = useUi();

  if (!hasAdvancedGPT) {
    return null;
  }

  // Find the current model to display its short name
  const currentModel = AI_MODELS.find(model => model.value === selectedModel);

  return (
      <div className={cn(className)}>
        <Select
          value={selectedModel}
          onValueChange={(value: FrontendModel) => {
            setSelectedModel(value);
            onModelChange(value);
          }}
        >
          <SelectTrigger
            className={cn(
              "w-fit hover:bg-foreground/5 cursor-pointer p-0 pl-1 flex items-center gap-1 border-none text-xs font-bold",
              { "text-sm font-normal": size === "md" },
              classNameTrigger,
            )}
          >
            <span>{currentModel?.shortName}</span>
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map(model => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
                {model.recommended && (
                  <span className="text-xs text-primary ml-4">
                    (Recommended)
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  );
}
