"use client";
import React from "react";
import { cn } from "@/lib/utils";

type Card = {
  id: number;
  content: JSX.Element | React.ReactNode | string;
  className?: string;
  thumbnail?: string;
};

interface MasonryGridProps {
  cards: Card[];
  columns?: number;
  gap?: number;
  className?: string;
}

export const MasonryGrid = ({ 
  cards, 
  columns = 3, 
  gap = 3,
  className 
}: MasonryGridProps) => {
  // Create dynamic columns based on the columns prop
  const columnArray = Array.from({ length: columns }, (_, i) => `col${i + 1}`);
  const columnsContent: Record<string, React.ReactNode[]> = {};
  
  // Initialize columns
  columnArray.forEach(colName => {
    columnsContent[colName] = [];
  });
  
  // Distribute cards among columns
  cards.forEach((card, i) => {
    const columnIndex = i % columns;
    const column = columnArray[columnIndex];
    
    columnsContent[column].push(
      <div 
        key={i} 
        className={cn(
          "relative overflow-hidden bg-background/90 text-foreground rounded-xl border border-border",
          `mb-${gap}`,
          card.className
        )}
      >
        <div className="p-3 w-full">
          <div className="relative">
            {card.content}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className={cn("w-full max-w-7xl mx-auto", className)}>
      <div className={cn(
        "grid",
        `grid-cols-1 md:grid-cols-${columns}`,
        `gap-${gap}`
      )}>
        {columnArray.map((colName) => (
          <div key={colName} className="flex flex-col">
            {columnsContent[colName]}
          </div>
        ))}
      </div>
    </div>
  );
};
