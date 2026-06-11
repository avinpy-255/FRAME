import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Settings as SettingsIcon, Folder, Sparkles, Sliders, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';

export default function Settings() {
  const navigate = useNavigate();
  const { setTheme: setUiTheme } = useUiStore();
  const { fetchProjects } = useProjectStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Settings state
  const [projectsRoot, setProjectsRoot] = useState('~/frame-projects');
  const [theme, setTheme] = useState('dark');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autosaveInterval, setAutosaveInterval] = useState(5000);
  const [defaultActStructure, setDefaultActStructure] = useState('three-act');
  const [fontScale, setFontScale] = useState(1.0);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const config = await res.json();
          setProjectsRoot(config.projectsRoot || '~/frame-projects');
          setTheme(config.theme || 'dark');
          setOllamaUrl(config.ollamaUrl || 'http://localhost:11434');
          setOllamaModel(config.ollamaModel || 'llama3.2');
          setAiEnabled(config.aiEnabled !== undefined ? config.aiEnabled : true);
          setAutosaveInterval(config.autosaveInterval || 5000);
          setDefaultActStructure(config.defaultActStructure || 'three-act');
          setFontScale(config.fontScale || 1.0);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to fetch settings from server');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload = {
        projectsRoot,
        theme,
        ollamaUrl,
        ollamaModel,
        aiEnabled,
        autosaveInterval: Number(autosaveInterval),
        defaultActStructure,
        fontScale: Number(fontScale)
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update config on server');
      
      // Update global UI theme state
      setUiTheme(theme);
      
      // Reload projects list (if project root changed)
      await fetchProjects();
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="text-sm font-mono">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-text pt-12 pl-0 md:pl-[48px] pr-4 md:pr-6 pb-16 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-6">
        
        {/* Header navigation */}
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <button 
            onClick={() => navigate('/')}
            className="p-1.5 bg-surface border border-border hover:border-gold/30 hover:text-gold text-text-muted rounded-md transition-all active:scale-95"
            title="Go back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col gap-0.5">
            <div className="text-[10px] font-mono tracking-widest text-gold uppercase font-semibold">Config & System Parameters</div>
            <h1 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-gold" />
              <span>Studio Settings</span>
            </h1>
          </div>
        </div>

        {/* Status indicator alerts */}
        {saved && (
          <div className="bg-green-950/20 border border-green-500/30 px-4 py-3 rounded-lg text-xs text-green-400 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Preferences saved and applied successfully.</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/20 border border-red-500/20 px-4 py-3 rounded-lg text-xs text-red-400">
            <strong>Save Error:</strong> {error}
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          
          {/* Section 1: Workspace folders */}
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 shadow-card">
            <div className="flex items-center gap-2 text-gold font-display font-semibold border-b border-border pb-2 text-sm">
              <Folder className="w-4 h-4" />
              <span>Workspace & Storage</span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted font-medium">Projects Root Directory</label>
              <input
                type="text"
                value={projectsRoot}
                onChange={(e) => setProjectsRoot(e.target.value)}
                required
                className="bg-surface-raised border border-border focus:border-gold rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
              <span className="text-[10px] text-text-faint">
                Supports home directory shorthand (<code>~</code>). Changing this path targets a different local directory.
              </span>
            </div>
          </div>

          {/* Section 2: AI Settings */}
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 shadow-card">
            <div className="flex items-center gap-2 text-gold font-display font-semibold border-b border-border pb-2 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Integration (Ollama)</span>
            </div>
            
            <label className="flex items-center gap-3 bg-surface-raised border border-border p-3 rounded-lg cursor-pointer hover:border-gold/20 transition-colors">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 text-gold bg-void border-border rounded focus:ring-gold/30 focus:ring-offset-0 focus:ring-1"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Enable LLM Assistant Sidebar</span>
                <span className="text-[10px] text-text-faint">Render the sparkles assistant panel inside sidebar.</span>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-medium">Ollama Endpoint URL</label>
                <input
                  type="url"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  required
                  disabled={!aiEnabled}
                  className="bg-surface-raised border border-border focus:border-gold rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-gold/30 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-medium">Default Model Tag</label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  required
                  disabled={!aiEnabled}
                  className="bg-surface-raised border border-border focus:border-gold rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-gold/30 disabled:opacity-50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Formatting & System Details */}
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 shadow-card">
            <div className="flex items-center gap-2 text-gold font-display font-semibold border-b border-border pb-2 text-sm">
              <Sliders className="w-4 h-4" />
              <span>Formatting & Studio Defaults</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-medium">Default Act Structure</label>
                <select
                  value={defaultActStructure}
                  onChange={(e) => setDefaultActStructure(e.target.value)}
                  className="bg-surface-raised border border-border focus:border-gold rounded-lg px-3 py-2 text-xs text-text focus:outline-none"
                >
                  <option value="three-act">Three-Act Structure</option>
                  <option value="five-act">Five-Act Structure</option>
                  <option value="custom">Single Act (Custom)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-medium">Interface Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-surface-raised border border-border focus:border-gold rounded-lg px-3 py-2 text-xs text-text focus:outline-none"
                >
                  <option value="dark">Cinematic Void (Carbon)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-medium">Autosave Interval (ms)</label>
                <input
                  type="number"
                  min="1000"
                  max="30000"
                  value={autosaveInterval}
                  onChange={(e) => setAutosaveInterval(e.target.value)}
                  required
                  className="bg-surface-raised border border-border focus:border-gold rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-gold/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-medium">UI Font Scale Modifier</label>
                <select
                  value={fontScale}
                  onChange={(e) => setFontScale(Number(e.target.value))}
                  className="bg-surface-raised border border-border focus:border-gold rounded-lg px-3 py-2 text-xs text-text focus:outline-none"
                >
                  <option value="0.8">0.8x (Compact)</option>
                  <option value="1.0">1.0x (Standard)</option>
                  <option value="1.2">1.2x (Large)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-transparent border border-border hover:border-text-muted px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gold hover:bg-gold-dim text-void px-6 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Settings</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
