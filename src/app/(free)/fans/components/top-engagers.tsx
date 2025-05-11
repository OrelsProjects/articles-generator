import React, { useState, useRef, useEffect, useMemo } from "react";
import { Engager } from "@/types/engager";
import EngagerAvatar from "./engager-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { generateFakeEngagers } from "../utils";
import { motion, AnimatePresence } from "framer-motion";

interface TopEngagersProps {
  engagers: Engager[];
  showFakes?: boolean;
  maxDisplayCount?: number;
  title?: string;
  hideFakes?: boolean;
  className?: string;
  loading?: boolean;
  isFree?: boolean;
  onClick: (engager: Engager) => void;
  onViewProfile?: (engager: Engager) => void;
}

const TopEngagers: React.FC<TopEngagersProps> = ({
  engagers,
  maxDisplayCount = 60,
  title = "",
  className = "",
  loading = false,
  hideFakes = false,
  isFree = false,
  onClick,
  onViewProfile,
}) => {
  const [hoveredEngager, setHoveredEngager] = useState<Engager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate fake engagers if needed
  const showFakes = useMemo(
    () => !hideFakes && engagers.length < maxDisplayCount,
    [engagers, hideFakes, maxDisplayCount],
  );
  const displayEngagers = useMemo(() => [...engagers], [engagers]);
  const fakesNeeded = useMemo(
    () =>
      showFakes ? Math.max(0, maxDisplayCount - displayEngagers.length) : 0,
    [displayEngagers.length, showFakes, maxDisplayCount],
  );

  // Add fake engagers to reach the maxDisplayCount if showFakes is true
  const fakeEngagers = useMemo(
    () => (fakesNeeded > 0 ? generateFakeEngagers(fakesNeeded) : []),
    [fakesNeeded],
  );
  const allEngagers = useMemo(
    () => [...displayEngagers, ...fakeEngagers],
    [displayEngagers, fakeEngagers],
  );

  // Limit to maxDisplayCount
  const visibleEngagers = useMemo(() => {
    const allEngagersCount = allEngagers.length;
    ;
    if (allEngagersCount <= maxDisplayCount && isFree) {
      return [...allEngagers, ...fakeEngagers].slice(0, maxDisplayCount);
    }
    return [...allEngagers].slice(0, maxDisplayCount);
  }, [allEngagers, maxDisplayCount]);

  // Handle engager hover
  const handleEngagerHover = (isHovering: boolean, engager: Engager) => {
    setHoveredEngager(isHovering ? engager : null);
  };

  // Generate skeleton loaders for engagers
  const renderSkeletons = () => {
    return Array.from({ length: 15 }).map((_, index) => (
      <div key={`skeleton-${index}`} className="flex-none -ml-3 first:ml-0">
        <Skeleton className="w-14 h-14 rounded-full border-2 border-background" />
      </div>
    ));
  };

  return (
    <div className={`${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-foreground mb-3">{title}</h3>
      )}

      <div
        ref={containerRef}
        className="min-h-[60px]" // Minimum height for container
      >
        {loading ? (
          <div className="flex flex-wrap items-center gap-y-2">
            {renderSkeletons()}
          </div>
        ) : visibleEngagers.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No engagers to display
          </p>
        ) : (
          <AnimatePresence>
            <motion.div className="flex flex-wrap items-center gap-y-2">
              {visibleEngagers.map((engager, index) => {
                const isFake = index >= displayEngagers.length;
                // Higher index = higher z-index for hover
                const zIndex =
                  hoveredEngager?.authorId === engager.authorId && !isFake
                    ? 100
                    : visibleEngagers.length - index;

                // Calculate manual delay based on index
                // Make the animation pattern more interesting by using row position
                const row = Math.floor(index / 5); // Assume 5 avatars per row
                const col = index % 5;

                // Diagonal wave effect - items on same diagonal appear together
                const diagonalSum = row + col;
                const delay = diagonalSum * 0.1;

                return (
                  <motion.div
                    key={engager.authorId}
                    className={`flex-none cursor-pointer -ml-3 first:ml-0 transition-transform hover:scale-110 ${hoveredEngager?.authorId === engager.authorId ? "z-[100]" : ""}`}
                    style={{ zIndex: zIndex }}
                    onClick={() => onClick(engager)}
                    custom={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 2.6,
                      delay: delay,
                      ease: [0.25, 0.1, 0.25, 1.0],
                    }}
                  >
                    <EngagerAvatar
                      engager={engager}
                      isFake={isFake}
                      onHover={handleEngagerHover}
                      onViewProfile={onViewProfile}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default TopEngagers;
