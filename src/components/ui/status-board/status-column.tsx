"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { StatusItem } from "./status-item";
import type { UniqueIdentifier } from "@dnd-kit/core";
import type { StatusItem as StatusItemType } from "./types";
import { cn } from "@/lib/utils";

interface StatusColumnProps {
  id: UniqueIdentifier;
  items: StatusItemType[];
  onSelectItem: (itemId: UniqueIdentifier) => void;
  selectedItem?: UniqueIdentifier;
  color?: string;
  orderFunction?: (item: StatusItemType) => number;
  className?: string;
}

export function StatusColumn({
  id,
  items,
  onSelectItem,
  selectedItem,
  color,
  orderFunction,
  className,
}: StatusColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  const sortedItems = useMemo(() => {
    return items.sort((a, b) => {
      return orderFunction ? orderFunction(a) - orderFunction(b) : 0;
    });
  }, [items, orderFunction]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 bg-muted/30 rounded-lg p-2 min-h-[300px]",
        color === "gray" && "bg-gray-200/15 dark:bg-gray-500/20",
        color === "amber" && "bg-amber-100/20 dark:bg-amber-500/20",
        color === "green" && "bg-green-100/20 dark:bg-green-500/20",
        className,
      )}
    >
      <SortableContext
        items={sortedItems.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1 overflow-auto">
          {sortedItems.map(item => (
            <StatusItem
              selected={selectedItem === item.id}
              key={item.id}
              item={item}
              onSelectItem={(itemId: UniqueIdentifier) => {
                onSelectItem(itemId);
              }}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
