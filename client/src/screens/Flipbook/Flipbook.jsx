import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  Maximize, 
  Minimize, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { useProjectStore } from '../../store/projectStore';
import Button from '../../components/ui/Button';
import FlipCard from './FlipCard';

export default function Flipbook() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { loadProject } = useProjectStore();
  const { scenes, fetchScenes, isLoading } = useSceneStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(3); // default 3s
  const [loop, setLoop] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const autoplayTimerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadProject(slug);
    fetchScenes(slug);
  }, [slug, loadProject, fetchScenes]);

  // Handle Autoplay timer loop
  useEffect(() => {
    if (isPlaying && scenes.length > 0) {
      autoplayTimerRef.current = setInterval(() => {
        handleNext();
      }, autoplaySpeed * 1000);
    }
    
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isPlaying, currentIndex, autoplaySpeed, scenes.length, loop]);

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, scenes.length, loop, isFullscreen]);

  const handleNext = () => {
    if (currentIndex < scenes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (loop) {
      setCurrentIndex(0);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (loop) {
      setCurrentIndex(scenes.length - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Sync fullscreen change listener (e.g. user hits Escape)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="text-sm font-mono">Loading flipbook preview...</span>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center pt-12 pl-0 md:pl-[48px] text-text-muted">
        <div className="border border-border bg-surface rounded-xl p-8 max-w-sm text-center shadow-card">
          <h3 className="font-display font-semibold text-lg text-gold mb-2">No Scenes Available</h3>
          <p className="text-xs mb-4">
            You must add scene cards on the Scene Board first before previewing them as a flipbook.
          </p>
          <Button variant="primary" onClick={() => navigate(`/project/${slug}/scenes`)}>
            Go to Scene Board
          </Button>
        </div>
      </div>
    );
  }

  const activeScene = scenes[currentIndex];

  return (
    <div 
      ref={containerRef}
      className={`
        h-screen w-screen flex flex-col justify-between bg-void text-text relative select-none
        ${isFullscreen ? 'p-6 z-50' : 'pt-12 pl-0 md:pl-[48px] p-4 md:p-6'}
      `}
    >
      
      {/* Top Header controls */}
      <div className="flex justify-between items-center bg-surface-raised border border-border px-4 py-2 rounded-xl shrink-0 shadow-card z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-gold">FLIPBOOK PREVIEW</span>
          <span className="text-text-faint font-mono text-xs">•</span>
          <span className="text-xs font-mono text-text-muted uppercase">Scene {currentIndex + 1} of {scenes.length}</span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Autoplay Controls */}
          <div className="flex items-center gap-2 border-r border-border pr-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded transition-all duration-200 ${isPlaying ? 'bg-gold text-void' : 'text-text-muted hover:text-text hover:bg-surface'}`}
              title={isPlaying ? 'Pause' : 'Play Autoplay'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span>Speed:</span>
              <input
                type="range"
                min="1"
                max="6"
                value={autoplaySpeed}
                onChange={(e) => setAutoplaySpeed(Number(e.target.value))}
                className="accent-gold w-20 h-1 bg-surface rounded-lg cursor-pointer"
                title={`${autoplaySpeed} seconds`}
              />
              <span className="font-mono w-4 text-right">{autoplaySpeed}s</span>
            </div>
          </div>

          {/* Loop toggle */}
          <button
            onClick={() => setLoop(!loop)}
            className={`p-1.5 rounded transition-all duration-200 ${loop ? 'text-gold bg-gold/10' : 'text-text-faint hover:text-text-muted'}`}
            title="Loop deck"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Maximize */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-text-muted hover:text-text rounded transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {!isFullscreen && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/project/${slug}/scenes`)}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Corkboard</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Slide Card Deck */}
      <div className="flex-1 flex items-center justify-center py-6 relative overflow-hidden">
        {/* Left Nav Button */}
        <button
          onClick={handlePrev}
          className="absolute left-4 z-20 p-3 bg-surface-raised border border-border hover:border-gold hover:text-gold rounded-full transition-all duration-200 active:scale-95 shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* The Card */}
        <div className="max-w-2xl w-full h-[460px] flex items-center justify-center [perspective:1000px]">
          <FlipCard 
            key={activeScene.id} 
            scene={activeScene} 
            index={currentIndex + 1} 
          />
        </div>

        {/* Right Nav Button */}
        <button
          onClick={handleNext}
          className="absolute right-4 z-20 p-3 bg-surface-raised border border-border hover:border-gold hover:text-gold rounded-full transition-all duration-200 active:scale-95 shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Progress indicators */}
      <div className="flex flex-col items-center gap-2 shrink-0 py-2">
        <div className="flex gap-1.5 max-w-lg overflow-x-auto py-1 px-4">
          {scenes.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-300
                ${index === currentIndex ? 'bg-gold w-5' : 'bg-border hover:bg-text-muted'}
              `}
              title={s.title || `Scene ${index + 1}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-text-faint uppercase tracking-wider">
          Use Left/Right keys to flip • Space to play/pause
        </span>
      </div>

    </div>
  );
}
