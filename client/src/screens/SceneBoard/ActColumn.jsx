import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SceneCard from './SceneCard';
import { Plus } from 'lucide-react';

export default function ActColumn({ act, scenes, onAddCard, onUpdateCard, onDeleteCard, slug }) {
  // Setup droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: act.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[280px] max-w-[320px] bg-surface/20 border rounded-xl flex flex-col h-[65vh] transition-all duration-200
        ${isOver ? 'bg-gold/5 border-gold/40 shadow-glow' : 'border-border'}
      `}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          {/* Act Color Circle Indicator */}
          <span 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: act.color || '#E8C547' }}
          />
          <h3 className="font-display font-semibold text-sm text-text">
            {act.label}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 rounded bg-surface border border-border">
          {scenes.length} {scenes.length === 1 ? 'card' : 'cards'}
        </span>
      </div>

      {/* Cards List container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
        <SortableContext
          items={scenes.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              onUpdate={onUpdateCard}
              onDelete={onDeleteCard}
              slug={slug}
            />
          ))}
        </SortableContext>

        {scenes.length === 0 && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border/60 rounded-lg py-12 px-4 text-center">
            <span className="text-xs text-text-faint italic">
              Drop cards here or click add below.
            </span>
          </div>
        )}
      </div>

      {/* Column Footer: Add Card */}
      <button
        onClick={() => onAddCard(act.id)}
        className="m-4 mt-0 p-2.5 border border-dashed border-border hover:border-gold/50 text-text-muted hover:text-gold rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs font-medium shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>Add Scene Card</span>
      </button>
    </div>
  );
}
