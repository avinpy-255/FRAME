import React from 'react';
import { Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function ResearchItem({ item, slug, onDelete, onLinkScene, scenes }) {
  // Render based on item type
  const renderCardBody = () => {
    switch (item.type) {
      case 'note':
        return (
          <div className="flex flex-col gap-2">
            <h4 className="font-display font-semibold text-sm text-text leading-tight tracking-wide">
              {item.title || 'Note'}
            </h4>
            <p className="text-xs text-text-muted leading-relaxed font-sans whitespace-pre-wrap">
              {item.content}
            </p>
          </div>
        );

      case 'color-swatch':
        return (
          <div className="flex flex-col gap-3">
            <div 
              className="w-full h-20 rounded border border-border/40 shadow-inner"
              style={{ backgroundColor: item.content || '#E8C547' }}
            />
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-text-muted">{item.title || 'Color Swatch'}</span>
              <span className="text-gold font-bold uppercase">{item.content}</span>
            </div>
          </div>
        );

      case 'image':
        const imgPath = item.filePath 
          ? `/api/projects/${slug}/assets/${item.filePath}` 
          : item.content;
        return (
          <div className="flex flex-col gap-2.5">
            <img 
              src={imgPath} 
              alt={item.title} 
              className="w-full h-auto object-cover rounded max-h-48 border border-border/40"
              loading="lazy"
            />
            {item.title && (
              <h4 className="font-display font-semibold text-xs text-text leading-tight truncate">
                {item.title}
              </h4>
            )}
          </div>
        );

      case 'link':
        let meta = {};
        try {
          meta = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
        } catch(e) {
          meta = { title: item.title, description: item.content };
        }
        
        return (
          <a 
            href={meta.url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col gap-2.5 group/link block"
          >
            {meta.image && (
              <img 
                src={meta.image} 
                alt={meta.title} 
                className="w-full h-auto object-cover rounded max-h-28 border border-border/40"
                loading="lazy"
              />
            )}
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 truncate">
                {meta.favicon && (
                  <img src={meta.favicon} alt="" className="w-3.5 h-3.5 shrink-0" />
                )}
                <h4 className="font-display font-semibold text-xs text-text group-hover/link:text-gold transition-colors truncate">
                  {meta.title || item.title || 'Bookmark'}
                </h4>
                <ExternalLink className="w-3 h-3 text-text-faint group-hover/link:text-gold transition-colors shrink-0" />
              </div>
              <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">
                {meta.description}
              </p>
            </div>
          </a>
        );

      default:
        return null;
    }
  };

  return (
    <div className="break-inside-avoid bg-surface border border-border rounded-xl p-4.5 mb-4 shadow-card hover:shadow-card-hover hover:border-gold/30 transition-all duration-300 relative group flex flex-col justify-between">
      
      {/* Body */}
      <div className="flex-1 min-h-0">
        {renderCardBody()}
      </div>

      {/* Footer list of linked scenes and trash */}
      <div className="flex justify-between items-center border-t border-border/60 pt-3 mt-3 shrink-0 text-[10px] font-mono text-text-muted">
        <div className="flex items-center gap-1.5 truncate max-w-[75%]">
          <LinkIcon className="w-3.5 h-3.5 text-gold-dim shrink-0" />
          {item.linkedScenes && item.linkedScenes.length > 0 ? (
            <div className="flex gap-1 overflow-x-auto truncate">
              {item.linkedScenes.map((sceneId, idx) => {
                const s = scenes.find(sc => sc.id === sceneId);
                return (
                  <span 
                    key={idx} 
                    className="bg-surface-raised border border-border px-1.5 py-0.5 rounded text-[8px] tracking-wide uppercase shrink-0"
                    title={s ? s.title : 'Scene'}
                  >
                    SC {s ? s.order : idx}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-text-faint text-[9px] italic">Unlinked</span>
          )}
        </div>

        {/* Hover Delete Action */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                onLinkScene(item.id, e.target.value);
              }
            }}
            className="bg-surface border border-border rounded text-[9px] px-1 py-0.5 text-text-muted hover:text-text cursor-pointer outline-none"
          >
            <option value="">Link SC...</option>
            {scenes.map(s => (
              <option key={s.id} value={s.id}>SC {s.order}: {s.title}</option>
            ))}
          </select>
          
          <button
            onClick={() => onDelete(item.id)}
            className="text-text-muted hover:text-red p-1 rounded"
            title="Delete Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
