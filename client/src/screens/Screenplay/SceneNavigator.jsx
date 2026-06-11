import React from 'react';
import { Compass, Users, MapPin, Film } from 'lucide-react';

export default function SceneNavigator({ headings, characters, totalElements, onHeadingClick }) {
  // Estimated pages: roughly 1 page per 54 screenplay elements or paragraphs
  const getPageCount = () => {
    return Math.max(1, Math.ceil(totalElements / 35));
  };

  return (
    <aside className="fixed md:relative inset-y-12 md:inset-y-0 left-0 z-20 md:z-auto w-60 border-r border-border bg-surface flex flex-col h-[calc(100vh-48px)] md:h-full shrink-0 shadow-lg md:shadow-none">
      
      {/* Document Stats Header */}
      <div className="p-4 border-b border-border flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2 text-text-muted">
          <Film className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold tracking-wide uppercase">Script Analytics</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-surface-raised border border-border p-2 rounded text-center">
            <span className="block text-lg font-bold text-gold font-mono">{getPageCount()}</span>
            <span className="text-[9px] font-mono text-text-muted uppercase">Est. Pages</span>
          </div>
          <div className="bg-surface-raised border border-border p-2 rounded text-center">
            <span className="block text-lg font-bold text-gold font-mono">{getPageCount()}m</span>
            <span className="text-[9px] font-mono text-text-muted uppercase">Run Time</span>
          </div>
        </div>
      </div>

      {/* Headings Navigator */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        
        {/* Scene Headings List */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono font-semibold tracking-wide text-text-muted uppercase flex items-center gap-1.5 px-1">
            <Compass className="w-3.5 h-3.5 text-gold-dim" />
            <span>Scene Headings</span>
          </span>
          
          <div className="flex flex-col gap-1">
            {headings.length > 0 ? (
              headings.map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => onHeadingClick(h.pos)}
                  className="text-left px-2 py-1.5 rounded text-[11px] font-mono transition-colors truncate text-text-muted hover:text-text hover:bg-surface-raised border border-transparent hover:border-border"
                >
                  {idx + 1}. {h.text}
                </button>
              ))
            ) : (
              <span className="text-[10px] text-text-faint p-2 italic">
                Type INT. or EXT. to create a scene heading.
              </span>
            )}
          </div>
        </div>

        {/* Detected Characters */}
        {characters.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-4">
            <span className="text-[10px] font-mono font-semibold tracking-wide text-text-muted uppercase flex items-center gap-1.5 px-1">
              <Users className="w-3.5 h-3.5 text-gold-dim" />
              <span>Speaking Roles</span>
            </span>
            <div className="flex flex-wrap gap-1 px-1">
              {characters.map((char, i) => (
                <span 
                  key={i} 
                  className="text-[9px] font-mono px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted uppercase"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
