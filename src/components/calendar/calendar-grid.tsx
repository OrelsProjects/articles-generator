"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { NoteDraft } from "@/types/note";
import { NoteCard } from "./note-card";
import { NoteDialog } from "./note-dialog";
import { NoteCardSkeleton } from "./note-card-skeleton";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  rectIntersection,
  useDroppable,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  notes: NoteDraft[];
  onNoteUpdate: (note: NoteDraft) => void;
}

function DateCell({ day, isDropTarget, notes, onClick, children }: { 
  day: Date; 
  isDropTarget: boolean;
  notes: NoteDraft[];
  onClick: (note: NoteDraft) => void;
  children?: React.ReactNode;
}) {
  const dayId = day.toISOString();
  const { setNodeRef } = useDroppable({ id: dayId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] border rounded-lg p-2 overflow-hidden",
        isDropTarget && "bg-muted/50 border-primary/50"
      )}
    >
      <div className="text-sm mb-2">{format(day, "d")}</div>
      <div className="space-y-2 no-scrollbar">
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onClick={() => onClick(note)}
          />
        ))}
        {children}
      </div>
    </div>
  );
}

// Edge zone components
function LeftEdgeZone({ onEnter }: { onEnter: () => void }) {
  const leftEdgeId = "left-edge-zone";
  const { setNodeRef, isOver } = useDroppable({ id: leftEdgeId });
  
  useEffect(() => {
    // This will trigger when isOver changes
    if (isOver) {
      onEnter();
    }
  }, [isOver, onEnter]);
  
  return (
    <div 
      ref={setNodeRef}
      className="absolute top-0 left-[-80px] w-[80px] h-full z-40 bg-blue-500/30"
      data-testid="left-edge-zone"
    />
  );
}

function RightEdgeZone({ onEnter }: { onEnter: () => void }) {
  const rightEdgeId = "right-edge-zone";
  const { setNodeRef, isOver } = useDroppable({ id: rightEdgeId });
  
  useEffect(() => {
    // This will trigger when isOver changes
    if (isOver) {
      onEnter();
    }
  }, [isOver, onEnter]);
  
  return (
    <div 
      ref={setNodeRef}
      className="absolute top-0 right-[-80px] w-[80px] h-full z-40 bg-blue-500/30"
      data-testid="right-edge-zone"
    />
  );
}

export function CalendarGrid({
  notes,
  onNoteUpdate,
}: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedNote, setSelectedNote] = useState<NoteDraft | null>(null);
  const [draggedNote, setDraggedNote] = useState<NoteDraft | null>(null);
  const [originalNoteDate, setOriginalNoteDate] = useState<Date | null>(null);
  const [monthChangeTimeout, setMonthChangeTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [edgeDetection, setEdgeDetection] = useState<"left" | "right" | null>(null);
  const [isChangingMonth, setIsChangingMonth] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right" | null>(null);
  const [edgeProgress, setEdgeProgress] = useState(0);
  const edgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const isOverEdgeRef = useRef<boolean>(false);

  // Add global style for no-scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
        overflow-y: auto;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (monthChangeTimeout) {
        clearTimeout(monthChangeTimeout);
      }
      if (edgeTimeoutRef.current) {
        clearInterval(edgeTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [monthChangeTimeout]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    }),
  );

  const days = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate),
  });

  const handleDragStart = (event: any) => {
    const noteId = event.active.id as string;
    const note = notes.find(n => n.id === noteId);
    if (note) {
      // Save the original note date separately
      setOriginalNoteDate(note.postDate || null);
      setDraggedNote(note);
    }
  };

  const changeMonth = (direction: "prev" | "next") => {
    // Instantly change the month without animations
    setSelectedDate(direction === "prev" ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1));
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!active) return;

    // If the event has an "over" property, update the drop target
    if (over) {
      console.log("DRAG OVER", over.id);
      setDropTargetId(over.id as string);
      
      // Check if we've moved away from the edge zones
      if (over.id !== "left-edge-zone" && over.id !== "right-edge-zone") {
        // Clear edge detection if we're over something that's not an edge zone
        if (edgeDetection) {
          console.log("EDGE DETECTION CLEARED");
          setEdgeDetection(null);
          setEdgeProgress(0);
          isOverEdgeRef.current = false;
          
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          if (edgeTimeoutRef.current) {
            clearInterval(edgeTimeoutRef.current);
            edgeTimeoutRef.current = null;
          }
          
          if (monthChangeTimeout) {
            clearTimeout(monthChangeTimeout);
            setMonthChangeTimeout(null);
          }
        }
      }
    } else {
      // If we're not over anything, also clear edge detection
      if (edgeDetection) {
        console.log("EDGE DETECTION CLEARED (no over target)");
        setEdgeDetection(null);
        setEdgeProgress(0);
        isOverEdgeRef.current = false;
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        if (edgeTimeoutRef.current) {
          clearInterval(edgeTimeoutRef.current);
          edgeTimeoutRef.current = null;
        }
        
        if (monthChangeTimeout) {
          clearTimeout(monthChangeTimeout);
          setMonthChangeTimeout(null);
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log("DRAG END", over?.id);
    
    // Clean up all timeouts and intervals
    if (monthChangeTimeout) {
      clearTimeout(monthChangeTimeout);
      setMonthChangeTimeout(null);
    }
    
    if (edgeTimeoutRef.current) {
      clearInterval(edgeTimeoutRef.current);
      edgeTimeoutRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Reset edge detection state
    setEdgeDetection(null);
    setEdgeProgress(0);
    isOverEdgeRef.current = false;

    // If there's no over target, or if it's not a valid droppable area,
    // restore the note to its original date
    if (!over || 
        (over.id !== "left-edge-zone" && 
         over.id !== "right-edge-zone" && 
         typeof over.id === 'string' && !over.id.includes("T"))) { // Date ISO strings contain 'T'
      console.log("DROPPED OUTSIDE CALENDAR - RESTORING ORIGINAL POSITION");
      
      if (draggedNote && originalNoteDate) {
        console.log("Restoring to original date:", originalNoteDate);
        // Restore the note to its original date
        onNoteUpdate({
          ...draggedNote,
          postDate: originalNoteDate
        });
      }
      
      setDraggedNote(null);
      setDropTargetId(null);
      setOriginalNoteDate(null);
      return;
    }

    // Handle dropping on edge zones
    if (over.id === "left-edge-zone") {
      console.log("DROPPED ON LEFT EDGE");
      setSelectedDate(prevDate => subMonths(prevDate, 1));
      setDraggedNote(null);
      setDropTargetId(null);
      setOriginalNoteDate(null);
      return;
    }
    
    if (over.id === "right-edge-zone") {
      console.log("DROPPED ON RIGHT EDGE");
      setSelectedDate(prevDate => addMonths(prevDate, 1));
      setDraggedNote(null);
      setDropTargetId(null);
      setOriginalNoteDate(null);
      return;
    }

    // Handle normal date drops
    const noteId = active.id as string;
    const targetDateString = over.id as string;
    const targetDate = new Date(targetDateString);
    const note = notes.find(n => n.id === noteId);

    if (note) {
      const sourceDate = note.postDate || new Date();
      // Only update if the date has changed
      if (!isSameDay(sourceDate, targetDate)) {
        onNoteUpdate({
          ...note,
          postDate: targetDate,
        });
      }
    }

    setDraggedNote(null);
    setDropTargetId(null);
    setOriginalNoteDate(null);
  };

  const handleDragCancel = () => {
    console.log("DRAG CANCELLED");
    
    setDraggedNote(null);
    setDropTargetId(null);
    setEdgeDetection(null);
    setEdgeProgress(0);
    setOriginalNoteDate(null);
    isOverEdgeRef.current = false;
    
    if (edgeTimeoutRef.current) {
      clearInterval(edgeTimeoutRef.current);
      edgeTimeoutRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (monthChangeTimeout) {
      clearTimeout(monthChangeTimeout);
      setMonthChangeTimeout(null);
    }
  };

  // Edge detection handler for the left edge
  const handleLeftEdgeEnter = useCallback(() => {
    console.log("LEFT EDGE ENTERED");
    setEdgeDetection("left");
    isOverEdgeRef.current = true;
    
    // Start progress tracking
    if (!progressIntervalRef.current) {
      console.log("Starting left edge progress tracking");
      setEdgeProgress(0);
      const startTime = Date.now();
      
      progressIntervalRef.current = setInterval(() => {
        if (!isOverEdgeRef.current) {
          // If no longer over the edge, stop tracking
          clearInterval(progressIntervalRef.current!);
          progressIntervalRef.current = null;
          return;
        }
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 600 * 100, 100);
        setEdgeProgress(progress);
        
        // When progress reaches 100%, change the month
        if (progress >= 100) {
          console.log("Left edge progress complete, changing month");
          clearInterval(progressIntervalRef.current!);
          progressIntervalRef.current = null;
          
          // Move to previous month
          setSelectedDate(prevDate => subMonths(prevDate, 1));
          
          // After a small delay, start the next progress if still over edge
          setTimeout(() => {
            if (isOverEdgeRef.current) {
              handleLeftEdgeEnter();
            }
          }, 50);
        }
      }, 20);
    }
  }, []);
  
  // Edge detection handler for the right edge
  const handleRightEdgeEnter = useCallback(() => {
    console.log("RIGHT EDGE ENTERED");
    setEdgeDetection("right");
    isOverEdgeRef.current = true;
    
    // Start progress tracking
    if (!progressIntervalRef.current) {
      console.log("Starting right edge progress tracking");
      setEdgeProgress(0);
      const startTime = Date.now();
      
      progressIntervalRef.current = setInterval(() => {
        if (!isOverEdgeRef.current) {
          // If no longer over the edge, stop tracking
          clearInterval(progressIntervalRef.current!);
          progressIntervalRef.current = null;
          return;
        }
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 600 * 100, 100);
        setEdgeProgress(progress);
        
        // When progress reaches 100%, change the month
        if (progress >= 100) {
          console.log("Right edge progress complete, changing month");
          clearInterval(progressIntervalRef.current!);
          progressIntervalRef.current = null;
          
          // Move to next month
          setSelectedDate(prevDate => addMonths(prevDate, 1));
          
          // After a small delay, start the next progress if still over edge
          setTimeout(() => {
            if (isOverEdgeRef.current) {
              handleRightEdgeEnter();
            }
          }, 50);
        }
      }, 20);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={() => changeMonth("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-2xl font-bold">
          {format(selectedDate, "MMMM yyyy")}
        </div>
        <Button
          variant="ghost"
          onClick={() => changeMonth("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center font-medium p-2">
            {day}
          </div>
        ))}
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        collisionDetection={rectIntersection}
      >
        <div className="relative mx-[80px]">
          <div ref={calendarRef} className="grid grid-cols-7 gap-1 flex-1 relative overflow-visible">
            {/* Left edge indicator */}
            {edgeDetection === "left" && (
              <div className="absolute top-0 left-[-80px] w-[80px] h-full bg-primary/30 z-50 pointer-events-none flex flex-col items-center justify-center">
                <div className="bg-primary rounded-full p-3">
                  <ChevronLeft className="h-12 w-12 text-white animate-pulse" />
                </div>
                {/* Progress indicator */}
                <div className="w-[80px] h-4 bg-white/30 mt-4 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white"
                    style={{ width: `${edgeProgress}%` }}
                  />
                </div>
                <div className="mt-2 text-white font-bold">
                  Previous Month
                </div>
              </div>
            )}
            
            {/* Right edge indicator */}
            {edgeDetection === "right" && (
              <div className="absolute top-0 right-[-80px] w-[80px] h-full bg-primary/30 z-50 pointer-events-none flex flex-col items-center justify-center">
                <div className="bg-primary rounded-full p-3">
                  <ChevronRight className="h-12 w-12 text-white animate-pulse" />
                </div>
                {/* Progress indicator */}
                <div className="w-[80px] h-4 bg-white/30 mt-4 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white"
                    style={{ width: `${edgeProgress}%` }}
                  />
                </div>
                <div className="mt-2 text-white font-bold">
                  Next Month
                </div>
              </div>
            )}
            
            {/* Left edge drop zone */}
            <LeftEdgeZone 
              onEnter={() => {
                handleLeftEdgeEnter();
              }}
            />
            
            {/* Right edge drop zone */}
            <RightEdgeZone 
              onEnter={() => {
                handleRightEdgeEnter();
              }}
            />
            
            <div className="col-span-7 grid grid-cols-7 gap-1 w-full">
              {days.map(day => {
                const dayNotes = notes.filter(note => 
                  note.postDate && isSameDay(note.postDate, day)
                );
                const dayId = day.toISOString();
                const isDropTarget = dropTargetId === dayId;

                return (
                  <DateCell 
                    key={dayId} 
                    day={day} 
                    isDropTarget={isDropTarget} 
                    notes={dayNotes}
                    onClick={setSelectedNote}
                  >
                    {isDropTarget && draggedNote && (
                      <NoteCardSkeleton className="mt-2" />
                    )}
                  </DateCell>
                );
              })}
            </div>
          </div>
        </div>

        <DragOverlay>
          {draggedNote && <NoteCard note={draggedNote} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {selectedNote && (
        <NoteDialog
          note={selectedNote}
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          onDateChange={date => {
            onNoteUpdate({
              ...selectedNote,
              postDate: date,
            });
          }}
        />
      )}
    </div>
  );
}
