import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, setBlockType, toggleMark } from 'prosemirror-commands';
import { 
  Loader2, 
  BookOpen, 
  Compass, 
  FileText, 
  Bold, 
  Italic, 
  Highlighter, 
  Heading1, 
  Heading2, 
  TextQuote,
  Eye,
  EyeOff
} from 'lucide-react';

import { useProjectStore } from '../../store/projectStore';
import { useUiStore } from '../../store/uiStore';
import { api } from '../../lib/api';

// 1. ProseMirror Custom Schema Definition
const storySchema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM() { return ['p', 0]; }
    },
    heading: {
      attrs: { level: { default: 1 } },
      content: 'inline*',
      group: 'block',
      defining: true,
      parseDOM: [
        { tag: 'h1', attrs: { level: 1 } },
        { tag: 'h2', attrs: { level: 2 } }
      ],
      toDOM(node) { return ['h' + node.attrs.level, 0]; }
    },
    blockquote: {
      content: 'block+',
      group: 'block',
      defining: true,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM() { return ['blockquote', 0]; }
    },
    text: { group: 'inline' }
  },
  marks: {
    strong: {
      parseDOM: [{ tag: 'strong' }, { style: 'font-weight=bold' }],
      toDOM() { return ['strong', 0]; }
    },
    em: {
      parseDOM: [{ tag: 'em' }, { style: 'font-style=italic' }],
      toDOM() { return ['em', 0]; }
    },
    highlight: {
      parseDOM: [{ tag: 'mark' }],
      toDOM() { return ['mark', { class: 'bg-gold/20 text-gold px-1 rounded' }, 0]; }
    }
  }
});

// 2. Simple Inline Markdown Parser/Serializer
function markdownToHtml(md) {
  if (!md) return '<p></p>';
  const lines = md.split('\n');
  let html = '';
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Blockquote handling
    if (line.startsWith('> ')) {
      if (!inBlockquote) {
        html += '<blockquote>';
        inBlockquote = true;
      }
      line = line.slice(2);
    } else {
      if (inBlockquote) {
        html += '</blockquote>';
        inBlockquote = false;
      }
    }

    if (line.startsWith('# ')) {
      html += `<h1>${parseInline(line.slice(2))}</h1>`;
    } else if (line.startsWith('## ')) {
      html += `<h2>${parseInline(line.slice(3))}</h2>`;
    } else if (line.trim() === '') {
      if (!inBlockquote) {
        html += '<p></p>';
      }
    } else {
      html += `<p>${parseInline(line)}</p>`;
    }
  }
  
  if (inBlockquote) {
    html += '</blockquote>';
  }

  return html;
}

function parseInline(text) {
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/==(.*?)==/g, '<mark>$1</mark>');
  return text;
}

function htmlToMarkdown(htmlDiv) {
  let markdown = '';
  
  for (let i = 0; i < htmlDiv.childNodes.length; i++) {
    const node = htmlDiv.childNodes[i];
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const inlineText = serializeInline(node);
      
      if (tag === 'h1') {
        markdown += `# ${inlineText}\n\n`;
      } else if (tag === 'h2') {
        markdown += `## ${inlineText}\n\n`;
      } else if (tag === 'blockquote') {
        const pTags = node.innerHTML.split(/<p>|<\/p>/).filter(l => l.trim().length > 0);
        pTags.forEach(line => {
          const tempNode = document.createElement('div');
          tempNode.innerHTML = line;
          markdown += `> ${serializeInline(tempNode)}\n`;
        });
        markdown += '\n';
      } else if (tag === 'p') {
        markdown += `${inlineText}\n\n`;
      }
    }
  }
  return markdown.trim() + '\n';
}

function serializeInline(element) {
  let text = '';
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
      const childText = serializeInline(child);
      if (tag === 'strong') {
        text += `**${childText}**`;
      } else if (tag === 'em') {
        text += `*${childText}*`;
      } else if (tag === 'mark') {
        text += `==${childText}==`;
      } else {
        text += childText;
      }
    }
  }
  return text;
}

export default function StoryEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { activeProject, loadProject } = useProjectStore();
  const { focusMode, toggleFocusMode, setAutosaveStatus } = useUiStore();

  const editorDomRef = useRef(null);
  const editorScrollContainerRef = useRef(null);
  const [editorView, setEditorView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [headings, setHeadings] = useState([]);
  const [showNavigator, setShowNavigator] = useState(true);
  
  const saveTimeoutRef = useRef(null);
  const latestDocRef = useRef(null);

  // Load project metadata and story content
  useEffect(() => {
    async function init() {
      setLoading(true);
      const project = await loadProject(slug);
      if (!project) {
        navigate('/');
        return;
      }

      try {
        const { text } = await api.getStory(slug);
        
        // Convert Markdown to ProseMirror-compatible DOM
        const html = markdownToHtml(text);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const initialDoc = DOMParser.fromSchema(storySchema).parse(tempDiv);
        latestDocRef.current = initialDoc;

        // Custom keyboard shortcuts
        const customKeys = keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-Shift-z': redo,
          'Mod-b': toggleMark(storySchema.marks.strong),
          'Mod-i': toggleMark(storySchema.marks.em),
          'Mod-h': toggleMark(storySchema.marks.highlight),
          'Mod-1': setBlockType(storySchema.nodes.heading, { level: 1 }),
          'Mod-2': setBlockType(storySchema.nodes.heading, { level: 2 }),
          'Mod-3': setBlockType(storySchema.nodes.paragraph),
          'Mod-4': setBlockType(storySchema.nodes.blockquote),
        });

        const state = EditorState.create({
          doc: initialDoc,
          plugins: [history(), customKeys, keymap(baseKeymap)],
        });

        // Instantiate EditorView
        if (editorDomRef.current) {
          // Clear any existing editor views
          editorDomRef.current.innerHTML = '';
          
          const view = new EditorView(editorDomRef.current, {
            state,
            dispatchTransaction(transaction) {
              const newState = view.state.apply(transaction);
              view.updateState(newState);
              handleEditorUpdate(view);
            },
          });
          setEditorView(view);
          
          // Initial updates
          calculateWords(initialDoc.textContent);
          updateSectionNavigator(initialDoc);
        }
      } catch (err) {
        console.error('Failed to load story content:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (editorView) editorView.destroy();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [slug]);

  // Handle Focus Mode Hotkey (F11)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFocusMode]);

  // Editor updates (autosave, outline navigation, cursor centering)
  const handleEditorUpdate = (view) => {
    const currentDoc = view.state.doc;
    
    // 1. Calculate words
    calculateWords(currentDoc.textContent);

    // 2. Update outline headers
    updateSectionNavigator(currentDoc);

    // 3. Typewriter Mode: Keep cursor vertically centered inside viewport
    if (focusMode && view.state.selection.empty) {
      setTimeout(() => {
        try {
          const coords = view.coordsAtPos(view.state.selection.from);
          const scrollContainer = editorScrollContainerRef.current;
          if (scrollContainer) {
            const rect = scrollContainer.getBoundingClientRect();
            const cursorY = coords.bottom - rect.top;
            const targetY = rect.height * 0.45; // center slightly above middle
            const diff = cursorY - targetY;
            if (Math.abs(diff) > 20) {
              scrollContainer.scrollTop += diff;
            }
          }
        } catch (e) {
          // ignore coords errors
        }
      }, 10);
    }

    // 4. Trigger debounced autosave if doc content changed
    if (!latestDocRef.current || !latestDocRef.current.eq(currentDoc)) {
      triggerAutosave(currentDoc);
    }
  };

  const calculateWords = (text) => {
    const words = text ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    setWordCount(words);
  };

  const updateSectionNavigator = (doc) => {
    const list = [];
    doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        list.push({
          text: node.textContent || 'Untitled Section',
          level: node.attrs.level,
          pos,
        });
      }
    });
    setHeadings(list);
  };

  const triggerAutosave = (doc) => {
    setAutosaveStatus('idle');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        const serializer = DOMSerializer.fromSchema(storySchema);
        const fragment = serializer.serializeFragment(doc.content);
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(fragment);
        const markdown = htmlToMarkdown(tempDiv);
        
        await api.updateStory(slug, markdown);
        latestDocRef.current = doc;
        setAutosaveStatus('saved');
      } catch (err) {
        setAutosaveStatus('error');
        console.error('Autosave failed:', err);
      }
    }, 3000); // 3-second debounce
  };

  const scrollToPos = (pos) => {
    if (!editorView) return;
    try {
      const coords = editorView.coordsAtPos(pos);
      const scrollContainer = editorScrollContainerRef.current;
      if (scrollContainer) {
        const rect = scrollContainer.getBoundingClientRect();
        scrollContainer.scrollTop += coords.top - rect.top - 80;
      }
      editorView.focus();
    } catch (e) {
      console.error('Could not scroll to position', e);
    }
  };

  const getEstimatedReadTime = () => {
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const getEstimatedScreenTime = () => {
    return Math.max(1, Math.ceil(wordCount / 150));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="text-sm font-mono">Loading story editor...</span>
      </div>
    );
  }

  return (
    <div className={`h-screen flex text-text ${focusMode ? 'pt-10' : 'pt-12 pl-0 md:pl-[48px]'}`}>
      
      {/* 1. Left side Section Navigator (collapsible, hidden in focus mode) */}
      {!focusMode && showNavigator && (
        <aside className="fixed md:relative inset-y-12 md:inset-y-0 left-0 z-20 md:z-auto w-60 border-r border-border bg-surface flex flex-col h-[calc(100vh-48px)] md:h-full shrink-0 shadow-lg md:shadow-none">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-text-muted">
            <Compass className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold tracking-wide uppercase">Document Navigator</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            {headings.length > 0 ? (
              headings.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    scrollToPos(h.pos);
                    if (window.innerWidth < 768) {
                      setShowNavigator(false);
                    }
                  }}
                  className={`
                    text-left px-2.5 py-1.5 rounded text-xs transition-colors truncate
                    hover:bg-surface-raised hover:text-text
                    ${h.level === 1 ? 'font-semibold text-gold-dim pl-2' : 'text-text-muted pl-5'}
                  `}
                >
                  {h.level === 1 ? '# ' : '## '} {h.text}
                </button>
              ))
            ) : (
              <span className="text-xs text-text-faint p-2 italic">
                Use headings (Ctrl+1, Ctrl+2) to populate outline.
              </span>
            )}
          </div>
        </aside>
      )}

      {/* 2. Main Editing Panel */}
      <main className="flex-1 flex flex-col relative h-full bg-void">
        
        {/* Editor controls ribbon (hidden in focus mode) */}
        {!focusMode && (
          <div className="h-10 border-b border-border bg-surface-raised flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setBlockType(storySchema.nodes.heading, { level: 1 })(editorView.state, editorView.dispatch);
                  editorView.focus();
                }}
                className="p-1.5 text-text-muted hover:text-text hover:bg-surface rounded"
                title="Act Heading (Ctrl+1)"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setBlockType(storySchema.nodes.heading, { level: 2 })(editorView.state, editorView.dispatch);
                  editorView.focus();
                }}
                className="p-1.5 text-text-muted hover:text-text hover:bg-surface rounded"
                title="Scene marker (Ctrl+2)"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setBlockType(storySchema.nodes.paragraph)(editorView.state, editorView.dispatch);
                  editorView.focus();
                }}
                className="p-1.5 text-text-muted hover:text-text hover:bg-surface rounded"
                title="Normal text (Ctrl+3)"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setBlockType(storySchema.nodes.blockquote)(editorView.state, editorView.dispatch);
                  editorView.focus();
                }}
                className="p-1.5 text-text-muted hover:text-text hover:bg-surface rounded"
                title="Quote/Aside (Ctrl+4)"
              >
                <TextQuote className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-border mx-2" />
              <button 
                onClick={() => {
                  toggleMark(storySchema.marks.strong)(editorView.state, editorView.dispatch);
                  editorView.focus();
                }}
                className="p-1.5 text-text-muted hover:text-text hover:bg-surface rounded"
                title="Bold (Ctrl+b)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  toggleMark(storySchema.marks.em)(editorView.state, editorView.dispatch);
                  editorView.focus();
                }}
                className="p-1.5 text-text-muted hover:text-text hover:bg-surface rounded"
                title="Italic (Ctrl+i)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  toggleMark(storySchema.marks.highlight)(editorView.state, editorView.dispatch);
                  editorView.focus();
                }}
                className="p-1.5 text-text-muted hover:text-text hover:bg-surface rounded"
                title="Highlight (Ctrl+h)"
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowNavigator(p => !p)}
              className="text-xs text-text-muted hover:text-text flex items-center gap-1.5 transition-colors"
            >
              {showNavigator ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showNavigator ? 'Hide Outline' : 'Show Outline'}</span>
            </button>
          </div>
        )}

        {/* Writing Canvas Area */}
        <div 
          ref={editorScrollContainerRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-12 scroll-smooth"
        >
          <div className="max-w-[680px] mx-auto min-h-full flex flex-col justify-start">
            <div 
              ref={editorDomRef} 
              className="prose prose-invert max-w-none pb-32"
            />
          </div>
        </div>

        {/* Word Count & Status Footer */}
        <div className="h-8 border-t border-border bg-surface flex items-center justify-between px-6 text-[10px] font-mono text-text-muted shrink-0 z-10">
          <div className="flex gap-4">
            <span>{wordCount} words</span>
            <span>{getEstimatedReadTime()}m read</span>
            <span>{getEstimatedScreenTime()}m screen</span>
          </div>
          <div>
            <span>Press <kbd className="bg-surface-raised px-1 py-0.5 rounded border border-border">F11</kbd> for Focus Mode</span>
          </div>
        </div>
      </main>
    </div>
  );
}
