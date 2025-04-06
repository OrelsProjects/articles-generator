"use client";

import { useState } from "react";
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
  onNewItem: () => Promise<unknown>;
  onSelectItem: (itemId: UniqueIdentifier) => void;
  selectedItem?: UniqueIdentifier;
  color?: string;
}

export function StatusColumn({
  id,
  items,
  onNewItem,
  onSelectItem,
  selectedItem,
  color,
}: StatusColumnProps) {
  const [loadingNewItem, setLoadingNewItem] = useState(false);

  const { setNodeRef } = useDroppable({
    id,
  });

  async function handleNewItem() {
    if (loadingNewItem) return;
    setLoadingNewItem(true);
    try {
      await onNewItem();
    } finally {
      setLoadingNewItem(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 bg-muted/30 rounded-lg p-2 min-h-[300px]",
        color === "gray" && "bg-gray-200/15 dark:bg-gray-500/20",
        color === "amber" && "bg-amber-100/20 dark:bg-amber-500/20",
        color === "green" && "bg-green-100/20 dark:bg-green-500/20",
      )}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1 overflow-auto">
          {items.map(item => (
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
