"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
  useDroppable,
  pointerWithin,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { StatusColumn } from "./status-column";
import { StatusColumnHeader } from "./status-column-header";
import { StatusItemOverlay } from "./status-item-overlay";
import type {
  StatusBoardProps,
  StatusColumn as StatusColumnType,
  StatusItem as StatusItemType,
} from "./types";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function StatusBoard({
  initialColumns,
  onStatusChange,
  onSelectItem,
  onNewItem,
  selectedItem,
  className = "",
  debug = false,
  hideArchiveColumn = false,
}: StatusBoardProps) {
  const [columns, setColumns] = useState<StatusColumnType[]>(initialColumns);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeItem, setActiveItem] = useState<StatusItemType | null>(null);
  const [startColumnId, setStartColumnId] = useState<UniqueIdentifier | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isOverArchive, setIsOverArchive] = useState(false);

  // Logging helper
  const log = (...args: any[]) => {
    if (debug) {
      console.log(...args);
    }
  };

  // Filter out archive column if hideArchiveColumn is true
  const displayColumns = hideArchiveColumn
    ? columns.filter(column => column.id !== "archived")
    : columns;

  // Add a useEffect to update columns when initialColumns change
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Find the active item when dragging starts
  useEffect(() => {
    if (!activeId) {
      setActiveItem(null);
      return;
    }

    // Find the item in all columns
    for (const column of columns) {
      const foundItem = column.items.find(item => item.id === activeId);
      if (foundItem) {
        setActiveItem(foundItem);
        return;
      }
    }
  }, [activeId, columns]);

  // Configure sensors for mouse, touch, and keyboard interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id);
    setIsDragging(true);

    // Save the starting column ID
    const columnId = findColumnOfItem(active.id);
    if (columnId) {
      setStartColumnId(columnId);
      log("Drag started from column:", columnId, "item:", active.id);
    }
  }

  // Handle drag over
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;

    if (!over) {
      setIsOverArchive(false);
      return;
    }

    // Check if over the archive zone
    if (over.id === "archive-zone") {
      setIsOverArchive(true);
      return;
    } else {
      setIsOverArchive(false);
    }

    const activeId = active.id;
    const overId = over.id;

    // Skip if the active and over are the same
    if (activeId === overId) return;

    // Find the columns
    const activeColumnId = findColumnOfItem(activeId);
    const overColumnId = findColumnOfItem(overId);

    log(
      "Drag over:",
      "activeId:",
      activeId,
      "overId:",
      overId,
      "activeColumnId:",
      activeColumnId,
      "overColumnId:",
      overColumnId,
    );

    // If no column is found, do nothing
    if (!activeColumnId || !overColumnId) return;

    // If the item is being dragged over a column directly (not another item)
    if (overColumnId === overId) {
      // If the item is already in this column, do nothing
      if (activeColumnId === overColumnId) return;

      log("Dragging over column:", overColumnId);

      // Move the item to the end of the column
      setColumns(prevColumns => {
        // Find the active item
        const activeColumn = prevColumns.find(col => col.id === activeColumnId);
        if (!activeColumn) return prevColumns;

        const activeItem = activeColumn.items.find(
          item => item.id === activeId,
        );
        if (!activeItem) return prevColumns;

        // Create new columns array
        return prevColumns.map(column => {
          // Remove from active column
          if (column.id === activeColumnId) {
            return {
              ...column,
              items: column.items.filter(item => item.id !== activeId),
            };
          }

          // Add to over column
          if (column.id === overColumnId) {
            return {
              ...column,
              items: [...column.items, { ...activeItem, status: column.id }],
            };
          }

          return column;
        });
      });
      return;
    }

    // If the columns are the same, do nothing (handled by sortable)
    if (activeColumnId === overColumnId) return;

    log("Dragging over item in different column:", overId);

    // If the item is being dragged over another item in a different column
    setColumns(prevColumns => {
      // Find the active item
      const activeColumn = prevColumns.find(col => col.id === activeColumnId);
      if (!activeColumn) return prevColumns;

      const activeItem = activeColumn.items.find(item => item.id === activeId);
      if (!activeItem) return prevColumns;

      // Find the over item
      const overColumn = prevColumns.find(col => col.id === overColumnId);
      if (!overColumn) return prevColumns;

      const overItemIndex = overColumn.items.findIndex(
        item => item.id === overId,
      );
      if (overItemIndex === -1) return prevColumns;

      // Create new columns array
      return prevColumns.map(column => {
        // Remove from active column
        if (column.id === activeColumnId) {
          return {
            ...column,
            items: column.items.filter(item => item.id !== activeId),
          };
        }

        // Add to over column at the specific position
        if (column.id === overColumnId) {
          const newItems = [...column.items];
          newItems.splice(overItemIndex, 0, {
            ...activeItem,
            status: column.id,
          });
          return {
            ...column,
            items: newItems,
          };
        }

        return column;
      });
    });
  }

  // Handle drag end
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setIsDragging(false);

    log(
      "Drag end:",
      "activeId:",
      active.id,
      "overId:",
      over?.id,
      "startColumnId:",
      startColumnId,
      "isOverArchive:",
      over?.id === "archive-zone",
    );

    if (!over) {
      setActiveId(null);
      setStartColumnId(null);
      return;
    }

    const activeId = active.id;

    // Handle archive zone drop
    if (over.id === "archive-zone") {
      // Find the active item
      const activeItem = findItemById(activeId);

      if (activeItem && onStatusChange) {
        try {
          // Update the item's status to archived
          const updatedItem = { ...activeItem, status: "archived" };
          // if it's
          // Call the onStatusChange callback with the updated item
          await onStatusChange(updatedItem, "archived");
        } catch (error) {
          log("Error archiving item:", error);
          toast.error("Failed to archive note");
        }
      }

      setActiveId(null);
      setStartColumnId(null);
      setIsOverArchive(false);
      return;
    }

    const overId = over.id;
    const currentColumnId = findColumnOfItem(overId);

    // If no column is found or no starting column, do nothing
    if (!currentColumnId || !startColumnId) {
      setActiveId(null);
      setStartColumnId(null);
      return;
    }

    // If the item was dropped in a different column than it started in
    if (startColumnId !== currentColumnId) {
      log(
        "Item moved to different column:",
        "item:",
        activeId,
        "from:",
        startColumnId,
        "to:",
        currentColumnId,
      );

      // Find the active item
      const activeItem = findItemById(activeId);

      if (activeItem && onStatusChange) {
        // Update the item's status to match the new column
        const updatedItem = { ...activeItem, status: currentColumnId };

        try {
          // Call the onStatusChange callback with the updated item
          await onStatusChange(updatedItem, currentColumnId);
        } catch (error) {
          log("Error updating status, reverting UI:", error);
          toast.error("Failed to update status. Reverting changes.");

          // Revert the UI change by moving the item back to its original column
          setColumns(prevColumns => {
            return prevColumns.map(column => {
              // Remove from current column
              if (column.id === currentColumnId) {
                return {
                  ...column,
                  items: column.items.filter(item => item.id !== activeId),
                };
              }

              // Add back to original column
              if (column.id === startColumnId) {
                return {
                  ...column,
                  items: [
                    ...column.items,
                    { ...activeItem, status: startColumnId },
                  ],
                };
              }

              return column;
            });
          });
        }
      }
    } else if (activeId !== overId) {
      // If the item was dropped over the same column but a different item, reorder
      const activeColumn = columns.find(col => col.id === currentColumnId);
      if (!activeColumn) {
        setActiveId(null);
        setStartColumnId(null);
        return;
      }

      const activeIndex = activeColumn.items.findIndex(
        item => item.id === activeId,
      );
      const overIndex = activeColumn.items.findIndex(
        item => item.id === overId,
      );

      if (activeIndex !== overIndex) {
        log(
          "Reordering item within column:",
          "column:",
          currentColumnId,
          "item:",
          activeId,
          "from index:",
          activeIndex,
          "to index:",
          overIndex,
        );

        setColumns(prevColumns => {
          return prevColumns.map(column => {
            if (column.id === currentColumnId) {
              const newItems = arrayMove(column.items, activeIndex, overIndex);
              return { ...column, items: newItems };
            }
            return column;
          });
        });
      }
    }

    setActiveId(null);
    setStartColumnId(null);
  }

  // Helper function to find which column contains an item
  function findColumnOfItem(
    itemId: UniqueIdentifier,
  ): UniqueIdentifier | undefined {
    for (const column of columns) {
      // Check if the itemId is a column id
      if (column.id === itemId) {
        return column.id;
      }

      // Check if the item is in this column
      if (column.items.some(item => item.id === itemId)) {
        return column.id;
      }
    }
    return undefined;
  }

  // Helper function to find an item by its ID
  function findItemById(itemId: UniqueIdentifier): StatusItemType | undefined {
    for (const column of columns) {
      const item = column.items.find(item => item.id === itemId);
      if (item) {
        return item;
      }
    }
    return undefined;
  }

  // Add a new item to a column
  function handleAddItem(columnId: UniqueIdentifier, content: string) {
    const newItem: StatusItemType = {
      id: `item-${Date.now()}`,
      content,
      status: columnId,
      createdAt: new Date().toISOString(),
    };

    setColumns(prevColumns => {
      return prevColumns.map(column => {
        if (column.id === columnId) {
          return {
            ...column,
            items: [...column.items, newItem],
          };
        }
        return column;
      });
    });
  }

  function handleSelectItem(itemId: UniqueIdentifier) {
    if (onSelectItem) {
      onSelectItem(itemId);
    }
  }

  async function handleNewItem(columnId: UniqueIdentifier) {
    await onNewItem?.(columnId);
  }

  return (
    <div className="relative">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}

      >
        <div
          className={`grid grid-cols-1 ${displayColumns.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-4 ${className}`}
        >
          {displayColumns.map(column => (
            <div key={column.id} className="flex flex-col h-full">
              <StatusColumnHeader
                title={column.title}
                color={column.color}
                icon={column.icon}
              />
              <StatusColumn
                id={column.id}
                items={column.items}
                color={column.color}
                selectedItem={selectedItem}
                onNewItem={() => handleNewItem(column.id)}
                onSelectItem={itemId => handleSelectItem(itemId)}
              />
            </div>
          ))}
        </div>

        {/* Archive Zone */}
        <AnimatePresence>
          {isDragging &&
            hideArchiveColumn &&
            activeItem &&
            activeItem.status !== "archived" && (
              <ArchiveZone isOver={isOverArchive} />
            )}
        </AnimatePresence>

        <DragOverlay>
          {activeItem ? <StatusItemOverlay item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Archive zone component
function ArchiveZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: "archive-zone",
  });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 w-80 h-32 rounded-lg flex flex-col items-center justify-center gap-2 ${
        isOver
          ? "bg-destructive text-destructive-foreground shadow-lg"
          : "bg-muted border-2 border-dashed border-destructive/50"
      }`}
    >
      <Trash2 className={`h-8 w-8 ${isOver ? "animate-bounce" : ""}`} />
      <span className="font-medium text-lg">Drop to Archive</span>
    </motion.div>
  );
}
