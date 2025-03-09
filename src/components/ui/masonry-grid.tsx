"use client";
import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Card = {
  id: number | string;
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
  className,
}: MasonryGridProps) => {
  // Create columns array
  const columnsArray = React.useMemo(() => {
    // Initialize empty columns
    const cols: Card[][] = Array.from({ length: columns }, () => []);

    // Sort cards by height (if we had that data) or distribute evenly
    // For now, we'll distribute cards evenly across columns
    cards.forEach((card, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push(card);
    });

    return cols;
  }, [cards, columns]);

  return (
    <div className={cn("w-full mx-auto", className)}>
      <div
        className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", {
          "lg:grid-cols-2": columns === 2,
          "lg:grid-cols-3": columns === 3,
          "lg:grid-cols-4": columns === 4,
        })}
        style={{ gap: `${gap * 0.25}rem` }}
      >
        {columnsArray.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col space-y-4">
            {column.map(card => (
              <div
                key={card.id}
                className={cn(
                  "relative overflow-hidden bg-background/90 text-foreground rounded-xl",
                  card.className,
                )}
              >
                {card.thumbnail && (
                  <div className="w-full h-48 overflow-hidden">
                    <Image
                      src={card.thumbnail}
                      alt="Card thumbnail"
                      width={500}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="relative">{card.content}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
