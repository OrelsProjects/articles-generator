import React, { useState, useRef, useEffect } from "react";
import { Engager } from "@/types/engager";
import EngagerAvatar from "./engager-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateFakeEngagers,
} from "../utils";

interface TopEngagersProps {
  engagers: Engager[];
  showFakes?: boolean;
  maxDisplayCount?: number;
  title?: string;
  className?: string;
  loading?: boolean;
}

const TopEngagers: React.FC<TopEngagersProps> = ({
  engagers,
  showFakes = false,
  maxDisplayCount = 20,
  title = "Top Engagers",
  className = "",
  loading = false,
}) => {
  const [hoveredEngager, setHoveredEngager] = useState<Engager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate fake engagers if needed
  const displayEngagers = [...engagers];
  const fakesNeeded = showFakes
    ? Math.max(0, maxDisplayCount - displayEngagers.length)
    : 0;

  // Add fake engagers to reach the maxDisplayCount if showFakes is true
  const fakeEngagers = fakesNeeded > 0 ? generateFakeEngagers(fakesNeeded) : [];
  const allEngagers = [...displayEngagers, ...fakeEngagers];

  // Limit to maxDisplayCount
  const visibleEngagers = allEngagers.slice(0, maxDisplayCount);

  // Handle engager hover
  const handleEngagerHover = (isHovering: boolean, engager: Engager) => {
    setHoveredEngager(isHovering ? engager : null);
  };

  // Generate skeleton loaders for 8 engagers
  const renderSkeletons = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="flex-none -ml-3 first:ml-0"
      >
        <Skeleton className="w-12 h-12 rounded-full border-2 border-background" />
      </div>
    ));
  };

  return (
    <div className={`${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-foreground mb-3">
          {title}
        </h3>
      )}

      <div
        ref={containerRef}
        className="min-h-[60px]" // Minimum height for container
      >
        <div className="flex flex-wrap items-center gap-y-2">
          {loading ? (
            renderSkeletons()
          ) : (
            visibleEngagers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No engagers to display</p>
            ) : (
              visibleEngagers.map((engager, index) => {
                const isFake = index >= displayEngagers.length;
                // Higher index = higher z-index for hover
                const zIndex =
                  hoveredEngager?.authorId === engager.authorId && !isFake
                    ? 100
                    : visibleEngagers.length - index;

                return (
                  <div 
                    key={engager.authorId}
                    className={`flex-none -ml-3 first:ml-0 transition-transform hover:scale-110 ${hoveredEngager?.authorId === engager.authorId ? 'z-[100]' : ''}`} 
                    style={{zIndex: zIndex}}
                  >
                    <EngagerAvatar
                      engager={engager}
                      isFake={isFake}
                      onHover={handleEngagerHover}
                    />
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TopEngagers;
