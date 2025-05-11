import React, { useState, useEffect, useRef } from "react";
import { Engager } from "@/types/engager";
import EngagerAvatar from "./engager-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateFakeEngagers,
  calculatePositions,
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
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredEngager, setHoveredEngager] = useState<Engager | null>(null);

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

  // Calculate positions based on container width
  const positions = calculatePositions(visibleEngagers.length, containerWidth);

  // Handle engager hover
  const handleEngagerHover = (isHovering: boolean, engager: Engager) => {
    setHoveredEngager(isHovering ? engager : null);
  };

  // Calculate total width needed for the avatar stack
  const totalWidth =
    visibleEngagers.length > 0
      ? positions[positions.length - 1] + 48 // 48px is the width of the avatar
      : 0;

  // Generate skeleton loaders for 8 engagers
  const renderSkeletons = () => {
    const skeletonCount = 8;
    const skeletonPositions = calculatePositions(skeletonCount, containerWidth);
    
    return Array.from({ length: skeletonCount }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="absolute transition-all duration-300 ease-in-out"
        style={{
          left: `${skeletonPositions[index]}px`,
          zIndex: skeletonCount - index,
        }}
      >
        <div className="relative">
          <Skeleton className="w-12 h-12 rounded-full border-2 border-background" />
        </div>
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
        className="relative"
        style={{ height: "60px" }} // Ensure there's enough height for the avatars and tooltip
      >
        <div
          className="relative"
          style={{ width: `${totalWidth}px`, height: "48px" }}
        >
          {loading ? (
            renderSkeletons()
          ) : (
            visibleEngagers.map((engager, index) => {
              const isFake = index >= displayEngagers.length;
              // Higher index = higher z-index for hover, but reverse it for initial display
              const zIndex =
                hoveredEngager?.authorId === engager.authorId && !isFake
                  ? 100
                  : visibleEngagers.length - index;

              return (
                <EngagerAvatar
                  key={engager.authorId}
                  engager={engager}
                  index={index}
                  isFake={isFake}
                  zIndex={zIndex}
                  position={positions[index]}
                  onHover={handleEngagerHover}
                />
              );
            })
          )}
        </div>

        {!loading && visibleEngagers.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No engagers to display</p>
        )}
      </div>
    </div>
  );
};

export default TopEngagers;
