import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Flame, FileText } from 'lucide-react';

export default function FlipCard({ scene, index }) {
  // Convert tone names to borders
  const getToneColor = (tone) => {
    switch (tone) {
      case 'drama': return 'border-scene-drama';
      case 'tension': return 'border-scene-tension text-scene-tension';
      case 'action': return 'border-scene-action';
      case 'comedy': return 'border-scene-comedy';
      case 'quiet': return 'border-scene-quiet';
      case 'transition': return 'border-scene-transition';
      default: return 'border-gold';
    }
  };

  const toneColor = getToneColor(scene.tone);

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90, scale: 0.95 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
      exit={{ opacity: 0, rotateY: -90, scale: 0.95 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        w-full h-full bg-surface-raised border border-border rounded-xl shadow-modal overflow-hidden flex flex-col justify-between p-4 sm:p-6 md:p-8 border-t-8 ${toneColor.split(' ')[0]}
      `}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Upper meta details */}
      <div className="flex justify-between items-start shrink-0 border-b border-border/60 pb-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-gold uppercase font-semibold">
            SCENE {String(index).padStart(2, '0')}
          </span>
          <h2 className="font-display font-bold text-2xl text-text leading-tight tracking-wide mt-1">
            {scene.title || 'Untitled Scene'}
          </h2>
        </div>
        
        {/* Tone Badge */}
        <span className="capitalize px-3 py-1 rounded bg-surface border border-border text-xs font-mono text-text-muted">
          {scene.tone}
        </span>
      </div>

      {/* Main Info Columns */}
      <div className="flex-1 py-4 md:py-6 flex flex-col md:flex-row gap-4 md:gap-8 overflow-y-auto md:overflow-hidden min-h-0">
        
        {/* Left Side Details */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Location slugline */}
          <div className="flex items-center gap-2.5 text-xs font-mono text-gold-dim">
            <span className="font-bold bg-surface px-2 py-0.5 rounded border border-border">{scene.location}</span>
            <span className="uppercase tracking-wide">{scene.locationName || 'LOCATION'}</span>
            <span className="text-text-faint">•</span>
            <span className="font-bold">{scene.timeOfDay}</span>
          </div>

          {/* Synopsis */}
          <div className="flex flex-col gap-1.5 mt-2">
            <span className="text-[9px] uppercase tracking-wider font-mono text-text-faint font-semibold">Synopsis</span>
            <p className="text-sm text-text-muted leading-relaxed font-sans font-light">
              {scene.synopsis || <span className="italic text-text-faint">No synopsis defined.</span>}
            </p>
          </div>
        </div>

        {/* Right Side metadata details */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6">
          
          {/* Characters list */}
          {scene.characters && scene.characters.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-wider font-mono text-text-faint font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Characters</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scene.characters.map((char, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conflict dots */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase tracking-wider font-mono text-text-faint font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-scene-tension" />
              <span>Conflict Intensity ({scene.conflictLevel}/5)</span>
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((dot) => (
                <span 
                  key={dot} 
                  className={`w-2 h-2 rounded-full ${dot <= scene.conflictLevel ? 'bg-scene-tension shadow-glow' : 'bg-border'}`}
                />
              ))}
            </div>
          </div>

          {/* Scene Notes */}
          {scene.notes && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-wider font-mono text-text-faint font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Director's Notes</span>
              </span>
              <p className="text-[11px] text-text-muted italic leading-relaxed">
                "{scene.notes}"
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Footer info */}
      <div className="border-t border-border/60 pt-4 shrink-0 flex justify-between items-center text-[10px] font-mono text-text-faint">
        <span>FRAME Story Studio</span>
        <span>Act color identifier: <span className="inline-block w-2.5 h-2.5 rounded-full align-middle ml-1" style={{ backgroundColor: scene.color || '#6B7FD4' }} /></span>
      </div>

    </motion.div>
  );
}
