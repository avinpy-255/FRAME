import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Sparkles, X, Send, Bot, User, Loader2, Info } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAiStore } from '../../store/aiStore';
import { useSceneStore } from '../../store/sceneStore';
import { useScreenplayStore } from '../../store/screenplayStore';

export default function AiPanel() {
  const { slug } = useParams();
  const location = useLocation();
  const chatEndRef = useRef(null);
  
  const { aiPanelOpen, setAiPanelOpen } = useUiStore();
  const { 
    status, 
    messages, 
    activeModel, 
    isOnline, 
    isLoading, 
    streamingText,
    checkStatus,
    setActiveModel,
    sendMessage,
    clearHistory
  } = useAiStore();

  const [input, setInput] = useState('');
  const [contextName, setContextName] = useState('Global');

  // Check Ollama status when panel opens
  useEffect(() => {
    if (aiPanelOpen) {
      checkStatus();
      determineContext();
    }
  }, [aiPanelOpen, location.pathname]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isLoading]);

  const determineContext = () => {
    if (location.pathname.includes('/story')) {
      setContextName('Story Treatment');
    } else if (location.pathname.includes('/scenes')) {
      setContextName('Scene Outline');
    } else if (location.pathname.includes('/screenplay')) {
      setContextName('Screenplay Script');
    } else {
      setContextName('Global');
    }
  };

  // Compile context data to inject into LLM system prompt
  const getContextSystemPrompt = async () => {
    let contextText = '';
    
    if (location.pathname.includes('/story')) {
      try {
        const res = await fetch(`/api/projects/${slug}/story`);
        if (res.ok) {
          const data = await res.json();
          contextText = `Story Treatment Content:\n${(data.text || '').slice(0, 4000)}`;
        }
      } catch (e) {
        console.error('Failed to inject story context:', e);
      }
      return `You are a story development consultant helping a screenwriter develop their story.
The writer is working on the story treatment text below.
${contextText}
Help the writer with story structure, character development, twists, and thematic pacing. Keep responses concise, actionable, and formatted in clean markdown.`;
    } 
    
    else if (location.pathname.includes('/scenes')) {
      const sceneStore = useSceneStore.getState();
      const scenesList = sceneStore.scenes || [];
      const actList = sceneStore.acts || [];
      
      const sequence = scenesList
        .sort((a,b) => a.order - b.order)
        .map((s, idx) => {
          const act = actList.find(a => a.id === s.act);
          return `Scene ${idx+1} [${act ? act.label : 'Act'}]: ${s.title} (${s.location} ${s.locationName}) - Synopsis: ${s.synopsis}`;
        })
        .join('\n');

      return `You are a structural story editor checking the writer's scene outline.
Here is the current scene sequence:
${sequence}
Help the writer analyze acts transitions, character presence balance, conflict peaks, pacing, and holes. Keep responses concise, analytical, and structured in bullet points.`;
    } 
    
    else if (location.pathname.includes('/screenplay')) {
      const screenplayStore = useScreenplayStore.getState();
      const elements = screenplayStore.elements || [];
      const activeSceneId = screenplayStore.activeSceneHeadingId;
      
      let surroundingElements = [];
      if (activeSceneId) {
        const activeIndex = elements.findIndex(el => el.id === activeSceneId);
        if (activeIndex !== -1) {
          // Pull up to 25 elements surrounding active scene heading
          surroundingElements = elements.slice(Math.max(0, activeIndex - 5), Math.min(elements.length, activeIndex + 20));
        }
      } else {
        surroundingElements = elements.slice(0, 30);
      }

      const scriptText = surroundingElements
        .map(el => {
          if (el.type === 'scene-heading') return `\n${el.content.toUpperCase()}\n`;
          if (el.type === 'character') return `  ${el.content.toUpperCase()}`;
          if (el.type === 'dialogue') return `    ${el.content}`;
          if (el.type === 'parenthetical') return `    (${el.content})`;
          return el.content;
        })
        .join('\n');

      return `You are a script editor helping a writer format and polish screenplay text.
Here is the script context:
${scriptText}
Review dialogue flow, action lines punchiness, and scene beats. Offer alternative rewrites or pacing critiques. Format responses in clean markdown.`;
    }
    
    return `You are a creative writing AI assistant for the FRAME Studio writer's app. Help the writer develop stories, pitch sheets, and loglines.`;
  };

  const handleSend = async (textToSend) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || isLoading) return;

    setInput('');
    const systemPrompt = await getContextSystemPrompt();
    await sendMessage(prompt, systemPrompt);
  };

  const getSuggestedChips = () => {
    if (contextName === 'Story Treatment') {
      return [
        'Suggest a plot twist',
        'Strengthen the main theme',
        'Flesh out the midpoint climax'
      ];
    } else if (contextName === 'Scene Outline') {
      return [
        'Check my act transitions',
        'Find structural pacing holes',
        'Suggest a high-tension scene'
      ];
    } else if (contextName === 'Screenplay Script') {
      return [
        'Polish dialogue punchiness',
        'Shorten these action lines',
        'Critique active scene flow'
      ];
    }
    return [
      'Brainstorm a story premise',
      'Generate genre keywords list',
      'Draft a logline formula'
    ];
  };

  if (!aiPanelOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-[360px] bg-surface border-l border-border z-50 flex flex-col shadow-modal transition-all duration-300">
      
      {/* 1. Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-surface-raised">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="font-display font-semibold text-sm text-text">AI Assistant</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-gold/10 border border-gold/20 text-gold rounded font-mono uppercase">
            {contextName}
          </span>
        </div>
        <button 
          onClick={() => setAiPanelOpen(false)}
          className="p-1 hover:bg-surface rounded text-text-muted hover:text-text transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Ollama Status Bar / Model Picker */}
      <div className="px-4 py-2 border-b border-border bg-surface flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span>Ollama: {isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        {isOnline && status.models && status.models.length > 0 ? (
          <select
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="bg-surface-raised border border-border rounded px-1.5 py-0.5 text-xs text-text focus:outline-none focus:border-gold font-mono"
          >
            {status.models.map((m, idx) => (
              <option key={idx} value={m.name}>{m.name}</option>
            ))}
          </select>
        ) : null}
      </div>

      {/* 3. Messages List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {!isOnline ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <Bot className="w-12 h-12 text-text-faint mb-3" />
            <h4 className="font-semibold text-sm text-text mb-1">Local LLM Offline</h4>
            <p className="text-xs mb-4">
              FRAME connects to Ollama running locally. Ensure Ollama is running on port 11434.
            </p>
            <a 
              href="https://ollama.com" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-gold border border-gold/30 hover:border-gold px-3 py-1.5 rounded transition-all bg-gold/5"
            >
              Get Ollama
            </a>
          </div>
        ) : messages.length === 0 && !streamingText && !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted gap-2">
            <Sparkles className="w-8 h-8 text-gold/30 mb-2" />
            <h4 className="font-display font-medium text-sm text-text">How can I assist your script?</h4>
            <p className="text-xs max-w-[220px]">
              Type a prompt or choose a context action below. I'll read your active editor text automatically.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2.5 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                  m.role === 'user' ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-surface-raised border-border text-text-muted'
                }`}>
                  {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`p-3 rounded-lg text-xs leading-relaxed overflow-x-auto ${
                  m.role === 'user' 
                    ? 'bg-gold/10 text-text border border-gold/20 rounded-tr-none' 
                    : 'bg-surface-raised text-text-muted border border-border rounded-tl-none prose prose-invert max-w-none'
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            
            {/* Streaming buffer assistant response */}
            {streamingText && (
              <div className="flex gap-2.5 max-w-[85%] self-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border bg-surface-raised border-border text-text-muted">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-lg text-xs leading-relaxed bg-surface-raised text-text-muted border border-border rounded-tl-none overflow-x-auto">
                  <p className="whitespace-pre-wrap">{streamingText}</p>
                  <span className="inline-block w-1.5 h-3 bg-gold/80 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {isLoading && !streamingText && (
              <div className="flex gap-2.5 self-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border bg-surface-raised border-border text-text-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                </div>
                <div className="p-2 px-3 rounded-lg text-xs bg-surface-raised border border-border text-text-faint italic">
                  Assistant is thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* 4. Suggested Prompt Chips */}
      {isOnline && (
        <div className="px-4 py-2 border-t border-border flex flex-col gap-1.5 bg-surface-raised shrink-0">
          <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase flex items-center gap-1">
            <Info className="w-3 h-3 text-gold/60" />
            <span>Suggested Context Prompts</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pb-1">
            {getSuggestedChips().map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                disabled={isLoading}
                className="text-[10px] px-2 py-1 bg-surface border border-border hover:border-gold/30 hover:text-gold text-text-muted rounded-md transition-all truncate max-w-[100%]"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Input Form */}
      <div className="p-3 border-t border-border bg-surface shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isOnline || isLoading}
            placeholder={isOnline ? "Ask AI Assistant..." : "Ollama offline"}
            className="flex-1 bg-surface-raised border border-border focus:border-gold rounded-md px-3 py-2 text-xs text-text placeholder-text-faint focus:outline-none focus:ring-1 focus:ring-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isOnline || isLoading || !input.trim()}
            className="p-2 bg-gold text-void rounded-md hover:bg-gold-dim active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="w-full text-center text-[10px] text-text-faint hover:text-text-muted mt-2 uppercase tracking-wide transition-colors"
          >
            Clear Conversation History
          </button>
        )}
      </div>
    </div>
  );
}
