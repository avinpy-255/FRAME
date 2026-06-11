import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  FlipHorizontal, 
  MapPin, 
  Clock, 
  Users, 
  Flame, 
  Trash2, 
  ArrowLeftRight,
  Sparkles,
  Save
} from 'lucide-react';

const TONES = [
  { value: 'drama', label: 'Drama', color: 'bg-scene-drama border-scene-drama' },
  { value: 'tension', label: 'Tension', color: 'bg-scene-tension border-scene-tension' },
  { value: 'action', label: 'Action', color: 'bg-scene-action border-scene-action' },
  { value: 'comedy', label: 'Comedy', color: 'bg-scene-comedy border-scene-comedy' },
  { value: 'quiet', label: 'Quiet', color: 'bg-scene-quiet border-scene-quiet' },
  { value: 'transition', label: 'Transition', color: 'bg-scene-transition border-scene-transition' }
];

export default function SceneCard({ scene, onUpdate, onDelete, slug }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [title, setTitle] = useState(scene.title || '');
  const [synopsis, setSynopsis] = useState(scene.synopsis || '');
  const [location, setLocation] = useState(scene.location || 'INT');
  const [locationName, setLocationName] = useState(scene.locationName || '');
  const [timeOfDay, setTimeOfDay] = useState(scene.timeOfDay || 'DAY');
  const [tone, setTone] = useState(scene.tone || 'drama');
  const [conflictLevel, setConflictLevel] = useState(scene.conflictLevel || 2);
  const [notes, setNotes] = useState(scene.notes || '');

  // dnd-kit sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: scene.id,
    disabled: isFlipped // disable drag when editing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const handleSave = () => {
    onUpdate(scene.id, {
      title,
      synopsis,
      location,
      locationName,
      timeOfDay,
      tone,
      conflictLevel,
      notes
    });
    setIsFlipped(false);
  };

  const activeToneColor = TONES.find(t => t.value === tone)?.color || 'bg-scene-drama';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full h-[320px] [perspective:1000px] mb-4 select-none"
    >
      <div 
        className={`
          relative w-full h-full rounded-lg transition-transform duration-500 [transform-style:preserve-3d] shadow-card
          ${isFlipped ? '[transform:rotateY(180deg)]' : ''}
        `}
      >
        
        {/* ================= FRONT FACE ================= */}
        <div 
          className="absolute inset-0 bg-surface-raised border border-border rounded-lg [backface-visibility:hidden] flex flex-col justify-between overflow-hidden"
        >
          {/* Tone Indicator Stripe */}
          <div className={`h-[4px] w-full ${activeToneColor.split(' ')[0]}`} />
          
          {/* Card Header */}
          <div className="p-3.5 pb-2 flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              {/* Drag Handle */}
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab p-0.5 text-text-faint hover:text-text-muted rounded"
              >
                <GripVertical className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-medium text-text-muted tracking-wider">
                SCENE {String(scene.order).padStart(2, '0')}
              </span>
            </div>
            
            <button
              onClick={() => setIsFlipped(true)}
              className="text-text-muted hover:text-gold p-1 rounded transition-colors"
              title="Edit Card Details"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card Body */}
          <div className="flex-1 px-4 py-1 flex flex-col gap-2 overflow-hidden">
            <h4 className="font-display font-semibold text-sm text-text leading-snug line-clamp-1">
              {scene.title || 'Untitled Scene'}
            </h4>
            
            {/* Slugline */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-gold-dim">
              <span className="font-bold">{scene.location}</span>
              <span className="text-text-faint">•</span>
              <span className="truncate max-w-[100px] uppercase">{scene.locationName || 'LOCATION'}</span>
              <span className="text-text-faint">•</span>
              <span className="font-bold">{scene.timeOfDay}</span>
            </div>

            {/* Synopsis preview */}
            <p className="text-xs text-text-muted line-clamp-4 leading-relaxed font-sans mt-1">
              {scene.synopsis || <span className="italic text-text-faint">No synopsis written. Flip card to edit.</span>}
            </p>
          </div>

          {/* Card Footer */}
          <div className="p-3.5 pt-2 border-t border-border flex justify-between items-center text-[10px] font-mono text-text-muted">
            {/* Conflict level */}
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-scene-tension" />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((dot) => (
                  <span 
                    key={dot} 
                    className={`w-1.5 h-1.5 rounded-full ${dot <= conflictLevel ? 'bg-scene-tension shadow-glow' : 'bg-border'}`}
                  />
                ))}
              </div>
            </div>

            {/* Tone label */}
            <span className="capitalize px-2 py-0.5 rounded bg-surface border border-border text-[9px] tracking-wide">
              {tone}
            </span>
          </div>
        </div>

        {/* ================= BACK FACE (EDIT FORM) ================= */}
        <div 
          className="absolute inset-0 bg-surface-raised border border-border rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between overflow-hidden p-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-border pb-1.5 mb-2.5">
            <span className="text-[10px] font-mono text-gold font-semibold uppercase">Edit Details</span>
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(scene.id)}
                className="text-text-muted hover:text-red p-1 rounded"
                title="Delete Card"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 text-xs">
            {/* Title */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase tracking-wider text-text-faint font-semibold">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-surface border border-border rounded px-2 py-1 text-text focus:border-gold outline-none"
              />
            </div>

            {/* Slugline inputs */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] uppercase tracking-wider text-text-faint font-semibold">Loc</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-surface border border-border rounded px-1.5 py-1 text-text focus:border-gold outline-none text-[11px]"
                >
                  <option value="INT">INT</option>
                  <option value="EXT">EXT</option>
                  <option value="INT/EXT">INT/EXT</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5 col-span-2">
                <label className="text-[9px] uppercase tracking-wider text-text-faint font-semibold">Location Name</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="OFFICE"
                  className="bg-surface border border-border rounded px-2 py-1 text-text focus:border-gold outline-none text-[11px]"
                />
              </div>
            </div>

            {/* Synopsis */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase tracking-wider text-text-faint font-semibold">Synopsis</label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={2}
                className="bg-surface border border-border rounded px-2 py-1 text-text focus:border-gold outline-none resize-none text-[11px] leading-normal"
              />
            </div>

            {/* Tone & Conflict Slider */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] uppercase tracking-wider text-text-faint font-semibold">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-surface border border-border rounded px-1 py-1 text-text focus:border-gold outline-none text-[11px]"
                >
                  {TONES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] uppercase tracking-wider text-text-faint font-semibold">Conflict ({conflictLevel})</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={conflictLevel}
                  onChange={(e) => setConflictLevel(Number(e.target.value))}
                  className="accent-gold mt-1.5 h-1 bg-surface rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase tracking-wider text-text-faint font-semibold">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                className="bg-surface border border-border rounded px-2 py-1 text-text focus:border-gold outline-none resize-none text-[11px]"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex gap-2 justify-end border-t border-border pt-2 mt-2">
            <button
              onClick={() => setIsFlipped(false)}
              className="px-2.5 py-1 text-[10px] text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1 bg-gold text-void font-semibold text-[10px] rounded hover:bg-gold-dim transition-colors"
            >
              <Save className="w-3 h-3" />
              <span>Save</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
