import React from 'react';

const BEATS_BY_ACT = {
  'act-1': ['Exposition', 'Inciting Incident', 'Plot Point 1'],
  'act-2': ['Rising Action', 'Pinch Point 1', 'Midpoint', 'Plot Point 2'],
  'act-3': ['Climax', 'Falling Action', 'Resolution']
};

export default function BeatOverlay({ acts }) {
  return (
    <div className="flex gap-6 px-1 mb-2 shrink-0">
      {acts.map((act) => {
        // Find beats for this act (fall back to defaults if custom acts)
        const beats = BEATS_BY_ACT[act.id] || BEATS_BY_ACT[act.id.toLowerCase()] || ['Action Beat'];
        
        return (
          <div 
            key={act.id} 
            className="flex-1 min-w-[280px] max-w-[320px] bg-surface border border-border/40 rounded-lg p-2 flex gap-1 justify-around items-center"
          >
            {beats.map((beat, idx) => (
              <span 
                key={idx} 
                className="text-[9px] font-mono font-medium text-gold/60 bg-gold/5 px-2 py-0.5 rounded border border-gold/10 tracking-wide uppercase truncate"
                title={beat}
              >
                {beat}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
