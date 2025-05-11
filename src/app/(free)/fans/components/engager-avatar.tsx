import React, { useState, useEffect, useRef } from "react";
import { Engager } from "@/types/engager";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EngagerAvatarProps {
  engager: Engager;
  isFake?: boolean;
  onHover?: (isHovering: boolean, engager: Engager) => void;
  onViewProfile?: (engager: Engager) => void;
}

const EngagerAvatar: React.FC<EngagerAvatarProps> = ({
  engager,
  isFake = false,
  onHover,
  onViewProfile,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setIsHovering(true);
    onHover?.(true, engager);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovering(false);
      onHover?.(false, engager);
    }, 150);
  };

  const showHover = isHovering;

  const HoverContent = () => (
    <>
      {isFake ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-2">
          <p className=" text-foreground">Want more?</p>
          <Button variant="default" size="sm" asChild>
            <Link href="/">Hell yeah</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="font-medium text-foreground">{engager.name}</p>
          {engager.subscriberCount !== undefined && (
            <p className="text-xs">
              Subscribers: {engager.subscriberCountString}
            </p>
          )}
          <Button
            variant="link"
            size="sm"
            className="md:hidden"
            onClick={() => {
              ;
              onViewProfile?.(engager);
            }}
          >
            View Profile
          </Button>
        </>
      )}
      <motion.div
        className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-card rotate-45 border-t border-l border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      />
    </>
  );

  return (
    <div
      className="relative overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={`engager-avatar-${engager.authorId}`}
    >
      <div className="relative">
        <motion.div
          className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-duration-300
            ${showHover ? "border-primary shadow-lg" : "border-background shadow-md"}
            ${isFake ? "opacity-70" : "opacity-100"}`}
          whileHover={{
            scale: 1.15,
            zIndex: 50,
            boxShadow: "0 0 8px rgba(var(--color-primary), 0.5)",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 12,
          }}
        >
          <img
            src={engager.photoUrl}
            alt={`${engager.name}'s avatar`}
            className={`w-full h-full object-cover ${isFake ? "blur-sm" : ""}`}
          />

          {/* Highlight effect on hover */}
          {showHover && (
            <motion.div
              className="absolute inset-0 bg-primary/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </motion.div>

        {/* Tooltip on hover */}
        {showHover && (
          <motion.div
            className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-card px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap z-50 border border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <HoverContent />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EngagerAvatar;
