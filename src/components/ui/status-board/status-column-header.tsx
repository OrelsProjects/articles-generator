import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatusColumnHeaderProps {
  title: string;
  color?: string;
  icon?: LucideIcon;
}

export function StatusColumnHeader({
  title,
  color,
  icon: Icon,
}: StatusColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "px-2 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800",
            color === "amber" && "bg-amber-100 text-amber-800",
            color === "green" && "bg-green-100 text-green-800",
            color === "gray" && "bg-gray-100 text-gray-800",
          )}
        >
          {Icon && <Icon className="h-4 w-4 mr-1 inline" />}
          {title}
        </div>
      </div>
    </div>
  );
}
