import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface CustomDragOverlayProps {
  children: React.ReactNode;
  adjustScale?: boolean;
  className?: string;
  zIndex?: number;
  transition?: string;
}

interface Position {
  x: number;
  y: number;
}

export function CustomDragOverlay({
  children,
  adjustScale = false,
  className = '',
  zIndex = 999,
  transition = 'transform 120ms ease'
}: CustomDragOverlayProps) {
  const { active, activatorEvent, over } = useDndContext();
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const initialOffset = useRef<Position>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  // Use a ref to store the element dimensions
  const elementDimensions = useRef({ width: 0, height: 0 });
  
  // Only render in browser environment
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Handle activation/deactivation with animation
  useEffect(() => {
    if (active) {
      // Short delay before showing to give time for dimensions to be measured
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [active]);
  
  // Set up movement tracking
  useEffect(() => {
    if (!active) return;
    
    // Store initial position from the activator event
    if (activatorEvent && 'clientX' in activatorEvent && 'clientY' in activatorEvent) {
      const event = activatorEvent as MouseEvent;
      initialOffset.current = { 
        x: event.clientX, 
        y: event.clientY 
      };
      setPosition(initialOffset.current);
    }
    
    // Mouse/touch move handler
    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (!active) return;
      
      let clientX: number;
      let clientY: number;
      
      if ('touches' in event) {
        // Touch event
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        // Mouse event
        clientX = event.clientX;
        clientY = event.clientY;
      }
      
      // Calculate centered position
      const x = clientX - (elementDimensions.current.width / 2);
      const y = clientY - 20; // Small offset from cursor
      
      setPosition({ x, y });
    };
    
    // Add listeners
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, [active, activatorEvent]);
  
  // Measure element dimensions
  const measureElement = (node: HTMLDivElement | null) => {
    if (node) {
      elementDimensions.current = {
        width: node.offsetWidth,
        height: node.offsetHeight
      };
    }
  };

  // If no drag is active or no children provided, don't render
  if (!active || !children) {
    return null;
  }

  // Determine scale - reduce slightly when over a drop target for feedback
  const isOverDroppable = over !== null;
  const scale = adjustScale 
    ? (isOverDroppable ? 0.92 : 0.95) 
    : (isOverDroppable ? 0.98 : 1);
  
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex,
    pointerEvents: 'none',
    left: position.x,
    top: position.y,
    transform: CSS.Transform.toString({
      x: 0,
      y: 0,
      scaleX: scale,
      scaleY: scale,
    }),
    transformOrigin: 'center center',
    width: 'auto',
    height: 'auto',
    transition: transition,
    opacity: isVisible ? 1 : 0
  };

  // Only render in browser environment using createPortal
  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className={className} style={style} ref={measureElement}>
      {children}
    </div>,
    document.body
  );
} 