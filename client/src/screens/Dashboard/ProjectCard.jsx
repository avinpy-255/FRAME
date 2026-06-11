import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlignLeft, Trash2, ExternalLink } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Convert slug/format name to human readable
  const getFormatLabel = (fmt) => {
    switch (fmt) {
      case 'short-film': return 'Short Film';
      case 'feature': return 'Feature Film';
      case 'series': return 'Series Episode';
      case 'documentary': return 'Documentary';
      default: return fmt;
    }
  };

  const handleCardClick = () => {
    navigate(`/project/${project.slug}/story`);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-surface border border-border hover:border-gold/50 rounded-lg shadow-card hover:shadow-card-hover p-5 cursor-pointer transition-all duration-300 select-none overflow-hidden group flex flex-col justify-between min-h-[180px]"
      style={{
        transform: isHovered 
          ? 'perspective(800px) rotateX(-2deg) rotateY(2deg) translateY(-2px)' 
          : 'none',
      }}
    >
      {/* Visual Accent Top Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-[4px]" 
        style={{ backgroundColor: project.color || '#E8C547' }}
      />

      {/* Main Details */}
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-display font-bold text-lg text-text group-hover:text-gold transition-colors duration-200 truncate pr-6">
            {project.title}
          </h3>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-gold uppercase tracking-wider">
            {getFormatLabel(project.format)}
          </span>
        </div>

        <p className="text-xs text-text-muted mb-4 line-clamp-2 min-h-[2rem]">
          {project.logline || 'No logline defined.'}
        </p>
      </div>

      {/* Stats and Actions Footer */}
      <div className="flex justify-between items-center border-t border-border/50 pt-3 mt-auto">
        <div className="flex items-center gap-4 text-[11px] font-mono text-text-faint">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlignLeft className="w-3.5 h-3.5" />
            <span>{project.wordCount || 0} words</span>
          </div>
        </div>

        {/* Hover Delete Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.slug, project.title);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-red hover:bg-red/10 rounded transition-all duration-200"
          title="Delete Project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
