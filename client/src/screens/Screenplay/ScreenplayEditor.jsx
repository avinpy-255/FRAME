import React, { useEffect, useRef, useState } from 'react';
import { useParams as useRouteParams, useNavigate as useRouteNavigate } from 'react-router-dom';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, setBlockType, toggleMark } from 'prosemirror-commands';
import { Loader2, AlignLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';

import { useProjectStore } from '../../store/projectStore';
import { useUiStore } from '../../store/uiStore';
import { useScreenplayStore } from '../../store/screenplayStore';
import { useCharacterStore } from '../../store/characterStore';
import { screenplaySchema } from './ScreenplaySchema';
import SplitPanel from '../../components/layout/SplitPanel';
import SceneNavigator from './SceneNavigator';
import SketchPanel from './SketchPanel';

// JSON serialization helper to map ProseMirror doc to screenplay elements array
function docToElements(doc) {
  const elements = [];
  doc.forEach((node, offset, index) => {
    elements.push({
      id: crypto.randomUUID(),
      type: node.type.name === 'paragraph' ? 'action' : node.type.name,
      content: node.textContent || '',
      sceneId: node.attrs.sceneId || null,
      locked: false,
      revisionMark: 'none'
    });
  });
  return elements;
}

// Map elements array to ProseMirror HTML string
function elementsToHtml(elements) {
  if (!elements || elements.length === 0) {
    return '<div class="action">Write screenplay action here...</div>';
  }

  return elements.map(el => {
    const typeClass = el.type;
    const sceneAttr = el.sceneId ? ` data-scene-id="${el.sceneId}"` : '';
    return `<div class="${typeClass}"${sceneAttr}>${el.content}</div>`;
  }).join('');
}

export default function ScreenplayEditor() {
  const { slug } = useRouteParams();
  const navigate = useRouteNavigate();
  
  const { loadProject } = useProjectStore();
  const { focusMode, toggleFocusMode, setAutosaveStatus } = useUiStore();
  const { 
    elements, 
    fetchScreenplay, 
    setElements, 
    saveScreenplay, 
    setActiveSceneHeadingId, 
    isLoading 
  } = useScreenplayStore();

  const {
    characters: castList,
    fetchCharacters,
    highlightColorsEnabled,
    setHighlightColorsEnabled
  } = useCharacterStore();

  const editorDomRef = useRef(null);
  const editorScrollContainerRef = useRef(null);
  
  const [editorView, setEditorView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNavigator, setShowNavigator] = useState(true);
  
  const [headings, setHeadings] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [editorDocLength, setEditorDocLength] = useState(0);

  const saveTimeoutRef = useRef(null);
  const latestDocRef = useRef(null);

  // Inject character outline highlights dynamically
  useEffect(() => {
    if (!editorDomRef.current || loading) return;
    
    const applyColors = () => {
      const charElements = editorDomRef.current.querySelectorAll('.character');
      charElements.forEach(el => {
        const name = el.textContent.trim().toUpperCase();
        const charObj = castList.find(c => c.name === name);
        if (highlightColorsEnabled && charObj) {
          el.style.color = charObj.color;
        } else {
          el.style.color = '';
        }
      });
    };

    applyColors();
  }, [castList, highlightColorsEnabled, editorDocLength, loading]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const project = await loadProject(slug);
      if (!project) {
        navigate('/');
        return;
      }

      try {
        await fetchScreenplay(slug);
        await fetchCharacters(slug);
      } catch (err) {
        console.error('Failed to load screenplay:', err);
      }
    }

    init();

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [slug]);

  // Setup ProseMirror Editor on elements load
  useEffect(() => {
    if (isLoading || elements.length === 0) return;

    if (editorDomRef.current && loading) {
      const html = elementsToHtml(elements);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const initialDoc = DOMParser.fromSchema(screenplaySchema).parse(tempDiv);
      latestDocRef.current = initialDoc;

      // Smart hotkey handlers
      const screenplayKeymap = keymap({
        'Mod-z': undo,
        'Mod-y': redo,
        'Mod-Shift-z': redo,
        'Tab': (state, dispatch) => {
          const { $from } = state.selection;
          const parent = $from.parent;
          const typeName = parent.type.name;

          let nextType = 'action';
          if (typeName === 'action') nextType = 'character';
          else if (typeName === 'character') nextType = 'dialogue';
          else if (typeName === 'dialogue') nextType = 'parenthetical';
          else if (typeName === 'parenthetical') nextType = 'action';

          return setBlockType(screenplaySchema.nodes[nextType])(state, dispatch);
        },
        'Enter': (state, dispatch) => {
          const { $from, $to } = state.selection;
          if ($from.pos !== $to.pos) return false;
          const parent = $from.parent;
          const typeName = parent.type.name;

          // Return to Action block on double empty Enter
          if (parent.textContent.trim().length === 0 && typeName !== 'action') {
            return setBlockType(screenplaySchema.nodes.action)(state, dispatch);
          }

          // Smart formatting links
          if (typeName === 'character') {
            const tr = state.tr.split($from.pos);
            const nextPos = $from.pos + 1;
            dispatch(tr.setBlockType(nextPos, nextPos, screenplaySchema.nodes.dialogue));
            return true;
          }

          if (typeName === 'parenthetical') {
            const tr = state.tr.split($from.pos);
            const nextPos = $from.pos + 1;
            dispatch(tr.setBlockType(nextPos, nextPos, screenplaySchema.nodes.dialogue));
            return true;
          }

          if (typeName === 'dialogue') {
            const tr = state.tr.split($from.pos);
            const nextPos = $from.pos + 1;
            dispatch(tr.setBlockType(nextPos, nextPos, screenplaySchema.nodes.action));
            return true;
          }

          if (typeName === 'scene_heading') {
            const tr = state.tr.split($from.pos);
            const nextPos = $from.pos + 1;
            dispatch(tr.setBlockType(nextPos, nextPos, screenplaySchema.nodes.action));
            return true;
          }

          return false;
        },
        // Direct format overrides
        'Mod-1': setBlockType(screenplaySchema.nodes.scene_heading),
        'Mod-2': setBlockType(screenplaySchema.nodes.action),
        'Mod-3': setBlockType(screenplaySchema.nodes.character),
        'Mod-4': setBlockType(screenplaySchema.nodes.dialogue),
        'Mod-5': setBlockType(screenplaySchema.nodes.parenthetical),
        'Mod-6': setBlockType(screenplaySchema.nodes.transition),
        'Mod-7': setBlockType(screenplaySchema.nodes.shot),
        'Mod-8': setBlockType(screenplaySchema.nodes.note),
      });

      const state = EditorState.create({
        doc: initialDoc,
        plugins: [history(), screenplayKeymap, keymap(baseKeymap)],
      });

      const view = new EditorView(editorDomRef.current, {
        state,
        dispatchTransaction(transaction) {
          const newState = view.state.apply(transaction);
          view.updateState(newState);
          handleEditorUpdate(view);
        }
      });

      setEditorView(view);
      setLoading(false);

      // Trigger initial outline checks
      parseOutline(initialDoc);
    }
  }, [elements]);

  // Handle auto sluglines typing and active scene detection on cursor updates
  const handleEditorUpdate = (view) => {
    const currentDoc = view.state.doc;
    setEditorDocLength(currentDoc.content.childCount);

    // 1. Auto-sluglines trigger
    const { $from } = view.state.selection;
    const parent = $from.parent;
    if (parent.type.name === 'action') {
      const text = parent.textContent.trim().toUpperCase();
      if (text.startsWith('INT.') || text.startsWith('EXT.') || text.startsWith('INT/EXT.')) {
        setBlockType(screenplaySchema.nodes.scene_heading)(view.state, view.dispatch);
      }
    }

    // 2. Sync outline navigator
    parseOutline(currentDoc);

    // 3. Scroll sync active scene heading ID
    detectActiveSceneHeading(view);

    // 4. Debounced Save
    if (!latestDocRef.current || !latestDocRef.current.eq(currentDoc)) {
      triggerAutosave(currentDoc);
    }
  };

  const parseOutline = (doc) => {
    const headingList = [];
    const charList = new Set();

    doc.forEach((node, offset) => {
      if (node.type.name === 'scene_heading') {
        headingList.push({
          text: node.textContent || 'Untitled Scene',
          pos: offset,
        });
      }
      if (node.type.name === 'character') {
        const name = node.textContent.trim().toUpperCase();
        if (name.length > 0) charList.add(name);
      }
    });

    setHeadings(headingList);
    setCharacters(Array.from(charList));
  };

  const detectActiveSceneHeading = (view) => {
    const { $from } = view.state.selection;
    let closestHeadingId = null;
    let closestHeadingText = '';

    // Walk backwards through nodes to find the closest preceding heading
    view.state.doc.nodesBetween(0, $from.pos, (node, pos) => {
      if (node.type.name === 'scene_heading') {
        closestHeadingId = pos;
        closestHeadingText = node.textContent;
      }
    });

    if (closestHeadingText) {
      setActiveSceneHeadingId(closestHeadingText);
    }
  };

  const triggerAutosave = (doc) => {
    setAutosaveStatus('idle');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        const elementsList = docToElements(doc);
        await setElements(slug, elementsList);
        latestDocRef.current = doc;
        setAutosaveStatus('saved');
      } catch (err) {
        setAutosaveStatus('error');
        console.error('Screenplay autosave failed:', err);
      }
    }, 4000); // 4s debounce
  };

  const scrollToHeading = (pos) => {
    if (!editorView) return;
    try {
      const coords = editorView.coordsAtPos(pos);
      const scrollContainer = editorScrollContainerRef.current;
      if (scrollContainer) {
        const rect = scrollContainer.getBoundingClientRect();
        scrollContainer.scrollTop += coords.top - rect.top - 100;
      }
      editorView.focus();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && elements.length === 0) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="text-sm font-mono">Loading screenplay editor...</span>
      </div>
    );
  }

  // Left child panel: Screenplay editor and navigator
  const editorLayoutLeft = (
    <div className="h-full flex min-h-0 w-full bg-void">
      {!focusMode && showNavigator && (
        <SceneNavigator
          headings={headings}
          characters={characters}
          totalElements={editorDocLength}
          onHeadingClick={(pos) => {
            scrollToHeading(pos);
            if (window.innerWidth < 768) {
              setShowNavigator(false);
            }
          }}
        />
      )}
      
      {/* Editor Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {!focusMode && (
          <div className="h-10 border-b border-border bg-surface-raised flex items-center justify-between px-6 shrink-0 z-10 text-xs text-text-muted">
            <div className="flex items-center gap-4">
              <span>Press <kbd className="bg-surface px-1 py-0.5 rounded border border-border">Tab</kbd> to change block types</span>
              <span className="text-text-faint">|</span>
              <button
                onClick={() => setHighlightColorsEnabled(!highlightColorsEnabled)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all duration-200 border ${highlightColorsEnabled ? 'border-gold/35 bg-gold/10 text-gold font-semibold' : 'border-border hover:border-text-muted text-text-muted hover:text-text'}`}
              >
                <span>Cast Colors</span>
              </button>
            </div>
            <button
              onClick={() => setShowNavigator(p => !p)}
              className="hover:text-text"
            >
              {showNavigator ? 'Hide Nav' : 'Show Nav'}
            </button>
          </div>
        )}

        <div 
          ref={editorScrollContainerRef}
          className="flex-1 overflow-y-auto px-4 md:px-12 py-6 md:py-16 scroll-smooth bg-void"
        >
          <div className="max-w-[700px] mx-auto min-h-full pl-6 md:pl-[60px] pb-32 select-text selection:bg-gold/20">
            {/* Courier screenplay style wrap */}
            <div 
              ref={editorDomRef} 
              className="font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Word count footer */}
        <div className="h-8 border-t border-border bg-surface flex items-center justify-between px-6 text-[10px] font-mono text-text-muted shrink-0 z-10">
          <span>Courier Prime 12pt format</span>
          <span>F11 Focus Mode</span>
        </div>
      </div>
    </div>
  );

  // Right child panel: Visual sketch reference panel
  const editorLayoutRight = (
    <SketchPanel slug={slug} />
  );

  return (
    <div className={`h-screen w-screen flex text-text ${focusMode ? 'pt-10' : 'pt-12 pl-0 md:pl-[48px]'}`}>
      <SplitPanel
        leftChild={editorLayoutLeft}
        rightChild={editorLayoutRight}
        defaultLeftWidth={60}
        leftLabel="Screenplay"
        rightLabel="Visual Pad"
      />
    </div>
  );
}
