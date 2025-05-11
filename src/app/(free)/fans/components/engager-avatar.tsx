import React, { useState } from "react";
import { Engager } from "@/types/engager";

interface EngagerAvatarProps {
  engager: Engager;
  isFake?: boolean;
  onHover?: (isHovering: boolean, engager: Engager) => void;
}

const EngagerAvatar: React.FC<EngagerAvatarProps> = ({
  engager,
  isFake = false,
  onHover,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    onHover?.(true, engager);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHover?.(false, engager);
  };

  const showHover = isHovering && !isFake;

  return (
    <div
      className="relative overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={`engager-avatar-${engager.authorId}`}
    >
      <div className="relative">
        <div
          className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-transform duration-300
            ${showHover ? "border-primary shadow-lg" : "border-background shadow-md"}
            ${isFake ? "opacity-100" : "opacity-100"}`}
        >
          <img
            src={engager.photoUrl}
            alt={`${engager.name}'s avatar`}
            className={`w-full h-full object-cover ${isFake ? "blur-sm" : ""}`}
          />

          {/* Highlight effect on hover */}
          {showHover && (
            <div className="absolute inset-0 bg-primary/10" />
          )}
        </div>

        {/* Tooltip on hover */}
        {showHover && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-card px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap z-50 animate-fadeIn border border-border">
            <p className="font-medium text-foreground">
              {engager.name}
            </p>
            {engager.subscriberCount !== undefined && (
              <p className="text-xs text-primary">
                Subscribers: {engager.subscriberCountString}
              </p>
            )}
            <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-card rotate-45 border-t border-l border-border" />
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagerAvatar;
