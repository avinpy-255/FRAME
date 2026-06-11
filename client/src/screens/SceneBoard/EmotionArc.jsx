import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

const TONE_VALUES = {
  tension: 5,
  action: 4,
  drama: 3,
  comedy: 2,
  quiet: 1,
  transition: 0
};

export default function EmotionArc({ scenes, acts, onSelectScene }) {
  // Prep data for Recharts
  const data = scenes.map((s, index) => {
    const actObj = acts.find(a => a.id === s.act);
    return {
      index: index + 1,
      id: s.id,
      title: s.title || `Scene ${index + 1}`,
      value: TONE_VALUES[s.tone] !== undefined ? TONE_VALUES[s.tone] : 2,
      tone: s.tone,
      actLabel: actObj ? actObj.label : 'Act 1',
      actColor: actObj ? actObj.color : '#E8C547'
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface-raised border border-border p-2.5 rounded shadow-lg text-[10px] font-mono flex flex-col gap-1 z-50">
          <span className="font-semibold text-gold font-display">Scene {data.index}: {data.title}</span>
          <span className="capitalize text-text-muted">Tone: {data.tone}</span>
          <span className="text-text-faint">{data.actLabel}</span>
        </div>
      );
    }
    return null;
  };

  const handlePointClick = (state) => {
    if (state && state.activePayload && state.activePayload[0]) {
      const clicked = state.activePayload[0].payload;
      onSelectScene(clicked.id);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col h-[180px] shrink-0 shadow-card">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] font-mono tracking-widest text-gold font-semibold uppercase">
          Emotional Arc Visualizer (Tone / Tension Curve)
        </span>
        <div className="flex gap-4 text-[9px] font-mono text-text-faint">
          <span>tension: 5</span>
          <span>action: 4</span>
          <span>drama: 3</span>
          <span>comedy: 2</span>
          <span>quiet: 1</span>
          <span>transition: 0</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {scenes.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data} 
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
              onClick={handlePointClick}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1C" />
              <XAxis 
                dataKey="index" 
                stroke="#4A4845" 
                fontSize={9} 
                tickLine={false}
              />
              <YAxis 
                domain={[0, 5]} 
                ticks={[0, 1, 2, 3, 4, 5]}
                stroke="#4A4845" 
                fontSize={9}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#242428', strokeWidth: 1 }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#E8C547" 
                strokeWidth={2}
                dot={{ fill: '#070708', stroke: '#E8C547', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#E8C547', stroke: '#070708', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-text-faint italic">No scenes available to graph.</span>
          </div>
        )}
      </div>
    </div>
  );
}
