import React, { useState, useRef, useEffect } from 'react';

export default function SplitPanel({ leftChild, rightChild, defaultLeftWidth = 60, leftLabel = "Script", rightLabel = "Sketchpad" }) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('left'); // 'left' | 'right'

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    
    const handleMouseMove = (moveEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate width percentage based on mouse clientX relative to container boundary
      const newWidth = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      
      // Restrict split boundaries between 25% and 80%
      if (newWidth > 25 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
        {/* Mobile Tab Selectors */}
        <div className="flex border-b border-border bg-surface-raised shrink-0 md:hidden z-10">
          <button
            onClick={() => setActiveTab('left')}
            className={`flex-1 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'left' 
                ? 'text-gold border-gold bg-surface/30' 
                : 'text-text-muted hover:text-text border-transparent'
            }`}
          >
            {leftLabel}
          </button>
          <button
            onClick={() => setActiveTab('right')}
            className={`flex-1 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'right' 
                ? 'text-gold border-gold bg-surface/30' 
                : 'text-text-muted hover:text-text border-transparent'
            }`}
          >
            {rightLabel}
          </button>
        </div>

        {/* Tab Content Panels (preserved on stack/DOM mount) */}
        <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden relative">
          <div className={`w-full h-full overflow-hidden flex flex-col shrink-0 ${activeTab === 'left' ? 'block' : 'hidden'}`}>
            {leftChild}
          </div>
          <div className={`w-full h-full overflow-hidden flex flex-col shrink-0 ${activeTab === 'right' ? 'block' : 'hidden'}`}>
            {rightChild}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 flex w-full h-full min-h-0 overflow-hidden">
      {/* Left panel child */}
      <div 
        style={{ width: `${leftWidth}%` }} 
        className="h-full overflow-hidden flex flex-col shrink-0"
      >
        {leftChild}
      </div>
      
      {/* Draggable vertical divider */}
      <div 
        onMouseDown={handleMouseDown}
        className="w-1.5 bg-border hover:bg-gold cursor-col-resize transition-all h-full select-none z-20 shrink-0 relative flex items-center justify-center group"
      >
        <div className="absolute w-[1px] h-8 bg-text-muted/30 group-hover:bg-void" />
      </div>

      {/* Right panel child */}
      <div 
        style={{ width: `${100 - leftWidth}%` }} 
        className="h-full overflow-hidden flex flex-col"
      >
        {rightChild}
      </div>
    </div>
  );
}
