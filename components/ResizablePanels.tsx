import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ResizablePanelsProps {
  children: React.ReactNode;
  initialPosition?: number;
  onPositionChange?: (position: number) => void;
}

export const ResizablePanels: React.FC<ResizablePanelsProps> = ({ children, initialPosition = 50, onPositionChange }) => {
  const [position, setPosition] = useState(initialPosition);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Clamp position between 15% and 85%
    const clampedPosition = Math.max(15, Math.min(85, newPosition));
    setPosition(clampedPosition);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    if(onPositionChange) {
        // Debounce or directly call onPositionChange
        onPositionChange(position);
    }
  }, [handleMouseMove, onPositionChange, position]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [handleMouseMove, handleMouseUp]);
  
  // Update parent component immediately during drag
  // useEffect(() => {
  //   if (isDragging.current && onPositionChange) {
  //     onPositionChange(position);
  //   }
  // }, [position, onPositionChange]);


  const childrenArray = React.Children.toArray(children);
  if (childrenArray.length !== 2) {
    console.error("ResizablePanels requires exactly two children.");
    return <div className="flex w-full h-full">{children}</div>;
  }

  return (
    <div ref={containerRef} className="flex w-full h-full gap-4">
      <div style={{ flexBasis: `${position}%` }} className="flex flex-col min-w-0">
        {childrenArray[0]}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="w-2 cursor-col-resize flex items-center justify-center group"
      >
        <div className="w-0.5 h-1/2 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-cyan-500 transition-colors"></div>
      </div>
      <div style={{ flexBasis: `${100 - position}%` }} className="flex flex-col min-w-0">
        {childrenArray[1]}
      </div>
    </div>
  );
};