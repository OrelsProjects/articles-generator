import { useState, useCallback } from 'react';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { NoteDraft } from '@/types/note';

interface UseDragOverlayOptions {
  findItemById?: (id: string) => NoteDraft | null;
}

interface UseDragOverlayReturn {
  activeDragItem: NoteDraft | null;
  activeDropTarget: string | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  setActiveDropTarget: (id: string | null) => void;
}

export function useDragOverlay(options: UseDragOverlayOptions = {}): UseDragOverlayReturn {
  const { findItemById } = options;
  const [activeDragItem, setActiveDragItem] = useState<NoteDraft | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    
    // If a findItemById function is provided, use it to find the item
    if (findItemById) {
      const item = findItemById(id);
      if (item) {
        setActiveDragItem(item);
      }
    } else {
      // Otherwise, try to use the data from the active item
      const item = active.data.current?.note;
      if (item) {
        setActiveDragItem(item);
      }
    }
  }, [findItemById]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragItem(null);
    setActiveDropTarget(null);
  }, []);

  return {
    activeDragItem,
    activeDropTarget,
    handleDragStart,
    handleDragEnd,
    setActiveDropTarget,
  };
} 