import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  DndContext, 
  DragOverlay,
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { 
  Plus, 
  Sparkles, 
  LineChart, 
  Layers, 
  ArrowLeftRight, 
  Filter, 
  Loader2,
  ListRestart
} from 'lucide-react';

import { useSceneStore } from '../../store/sceneStore';
import { useProjectStore } from '../../store/projectStore';
import BoardCanvas from './BoardCanvas';
import ActColumn from './ActColumn';
import BeatOverlay from './BeatOverlay';
import EmotionArc from './EmotionArc';
import Button from '../../components/ui/Button';
import Flipbook from '../Flipbook/Flipbook';

export default function SceneBoard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFlipbookMode = searchParams.get('mode') === 'flipbook';

  const { loadProject, activeProject } = useProjectStore();
  const {
    acts,
    scenes,
    fetchScenes,
    addScene,
    updateScene,
    deleteScene,
    reorderScenes,
    addAct,
    parseStoryToScenes,
    beatOverlayEnabled,
    setBeatOverlayEnabled,
    emotionArcEnabled,
    setEmotionArcEnabled,
    filterTone,
    setFilterTone,
    isLoading
  } = useSceneStore();

  const [activeDragId, setActiveDragId] = useState(null);
  const [newActName, setNewActName] = useState('');
  const [showAddAct, setShowAddAct] = useState(false);

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require drag to move 8px before moving card
      },
    })
  );

  useEffect(() => {
    loadProject(slug);
    fetchScenes(slug);
  }, [slug, loadProject, fetchScenes]);

  if (isFlipbookMode) {
    return <Flipbook />;
  }

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeScene = scenes.find((s) => s.id === activeId);
    if (!activeScene) return;

    let targetActId = null;
    let targetIndex = -1;

    // Check if over another scene card
    const overScene = scenes.find((s) => s.id === overId);
    if (overScene) {
      targetActId = overScene.act;
      targetIndex = scenes.indexOf(overScene);
    } else {
      // Over act column
      targetActId = overId;
    }

    // Move logic
    const updatedScenes = [...scenes];
    const activeIdx = scenes.findIndex((s) => s.id === activeId);

    // Remove from current slot
    updatedScenes.splice(activeIdx, 1);
    
    // Assign new act ID
    activeScene.act = targetActId;

    if (overScene) {
      // Insert at target card index
      let insertIdx = updatedScenes.findIndex((s) => s.id === overId);
      if (insertIdx < 0) insertIdx = 0;
      updatedScenes.splice(insertIdx, 0, activeScene);
    } else {
      // Insert at the end of the matching act group
      const actScenes = updatedScenes.filter((s) => s.act === targetActId);
      if (actScenes.length > 0) {
        const lastInAct = actScenes[actScenes.length - 1];
        const lastIdx = updatedScenes.findIndex((s) => s.id === lastInAct.id);
        updatedScenes.splice(lastIdx + 1, 0, activeScene);
      } else {
        // Appending to end
        updatedScenes.push(activeScene);
      }
    }

    reorderScenes(slug, updatedScenes);
  };

  const handleAddCard = (actId) => {
    addScene(slug, { act: actId });
  };

  const handleCreateAct = (e) => {
    e.preventDefault();
    if (!newActName.trim()) return;
    addAct(slug, newActName.trim());
    setNewActName('');
    setShowAddAct(false);
  };

  const handleDeleteCard = (id) => {
    if (window.confirm('Are you sure you want to delete this scene card?')) {
      deleteScene(slug, id);
    }
  };

  // Filter scenes based on active toolbar settings
  const getFilteredScenes = () => {
    return scenes.filter((s) => {
      if (filterTone !== 'all' && s.tone !== filterTone) return false;
      return true;
    });
  };

  const filteredScenes = getFilteredScenes();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="text-sm font-mono">Loading scene board...</span>
      </div>
    );
  }

  const activeDragScene = scenes.find((s) => s.id === activeDragId);

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col bg-void text-text pt-12 pl-0 md:pl-[48px]">
      
      {/* 3D WebGL ambient background */}
      <BoardCanvas />

      {/* Main Board layer */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 p-4 md:p-6 pointer-events-auto">
        
        {/* Board Toolbar */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-between items-stretch sm:items-center gap-3 bg-surface-raised/80 backdrop-blur border border-border/80 px-4 py-2.5 rounded-xl mb-4 shrink-0 shadow-card">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Tone Filter */}
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={filterTone}
                onChange={(e) => setFilterTone(e.target.value)}
                className="bg-surface border border-border rounded px-2 py-1 text-text outline-none text-[11px]"
              >
                <option value="all">All Tones</option>
                <option value="drama">Drama</option>
                <option value="tension">Tension</option>
                <option value="action">Action</option>
                <option value="comedy">Comedy</option>
                <option value="quiet">Quiet</option>
              </select>
            </div>

            {/* Overlays toggles */}
            <Button
              variant={beatOverlayEnabled ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setBeatOverlayEnabled(!beatOverlayEnabled)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Beat Overlay</span>
            </Button>

            <Button
              variant={emotionArcEnabled ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setEmotionArcEnabled(!emotionArcEnabled)}
              className="flex items-center gap-1.5 text-xs"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Emotional Arc</span>
            </Button>

            {/* Parse Story Option */}
            {scenes.length === 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => parseStoryToScenes(slug)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse Treatment to Cards</span>
              </Button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {scenes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm('Re-parsing will overwrite your current scene cards. Do you want to continue?')) {
                    parseStoryToScenes(slug);
                  }
                }}
                className="flex items-center gap-1.5 text-xs hover:text-red hover:bg-red/10 animate-transition"
                title="Reset cards by parsing story.md"
              >
                <ListRestart className="w-3.5 h-3.5" />
                <span>Reset from Story</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddAct(true)}
              className="flex items-center gap-1 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Act</span>
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/project/${slug}/scenes?mode=flipbook`)}
              className="flex items-center gap-1.5 px-4 font-semibold text-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Flipbook Mode</span>
            </Button>
          </div>
        </div>

        {/* Add Act inline wizard */}
        {showAddAct && (
          <form 
            onSubmit={handleCreateAct}
            className="flex items-center gap-2 bg-surface border border-border p-3 rounded-lg mb-4 max-w-sm shrink-0 self-end shadow-card"
          >
            <input
              type="text"
              placeholder="Act Title (e.g. Act 2: Climax)"
              value={newActName}
              onChange={(e) => setNewActName(e.target.value)}
              className="bg-surface-raised border border-border rounded px-2.5 py-1.5 text-xs text-text focus:border-gold outline-none w-full"
              autoFocus
              required
            />
            <Button type="submit" variant="primary" size="sm">Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddAct(false)}>Cancel</Button>
          </form>
        )}

        {/* Beat Overlay guide lines */}
        {beatOverlayEnabled && <BeatOverlay acts={acts} />}

        {/* Board Columns (dnd-kit Context wrap) */}
        <div className="flex-1 overflow-x-auto flex gap-6 items-start pb-4 pr-12 min-h-0 select-none">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {acts.map((act) => {
              const actScenes = filteredScenes.filter((s) => s.act === act.id);
              return (
                <ActColumn
                  key={act.id}
                  act={act}
                  scenes={actScenes}
                  onAddCard={handleAddCard}
                  onUpdateCard={(id, data) => updateScene(slug, id, data)}
                  onDeleteCard={handleDeleteCard}
                  slug={slug}
                />
              );
            })}
          </DndContext>
        </div>

        {/* Emotional Arc (Line graph overlay) */}
        {emotionArcEnabled && (
          <div className="mt-4 shrink-0">
            <EmotionArc
              scenes={filteredScenes}
              acts={acts}
              onSelectScene={(id) => {
                // Focus card or trigger a card highlight
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
