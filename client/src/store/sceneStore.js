import { create } from 'zustand';
import { api } from '../lib/api';
import { useUiStore } from './uiStore';

// Extend our api helper with new scenes endpoints
const scenesApi = {
  getScenes: (slug) => fetch(`/api/projects/${slug}/scenes`).then(r => r.ok ? r.json() : Promise.reject('Failed to load scenes')),
  saveScenes: (slug, data) => fetch(`/api/projects/${slug}/scenes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.ok ? r.json() : Promise.reject('Failed to save scenes')),
  parseStory: (slug) => fetch(`/api/projects/${slug}/scenes/parse`, {
    method: 'POST'
  }).then(r => r.ok ? r.json() : Promise.reject('Failed to parse story'))
};

export const useSceneStore = create((set, get) => ({
  acts: [],
  scenes: [],
  selectedSceneId: null,
  
  // View states
  beatOverlayEnabled: false,
  emotionArcEnabled: false,
  
  // Filters
  filterTone: 'all',
  filterCharacter: 'all',
  filterSearch: '',
  
  isLoading: false,
  error: null,

  fetchScenes: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const data = await scenesApi.getScenes(slug);
      set({ 
        acts: data.acts || [], 
        scenes: data.scenes || [], 
        isLoading: false 
      });
    } catch (err) {
      set({ error: err.toString(), isLoading: false });
    }
  },

  saveScenes: async (slug) => {
    const { acts, scenes } = get();
    const setAutosaveStatus = useUiStore.getState().setAutosaveStatus;
    
    setAutosaveStatus('saving');
    try {
      const payload = { version: '1.0', acts, scenes };
      await scenesApi.saveScenes(slug, payload);
      setAutosaveStatus('saved');
    } catch (err) {
      setAutosaveStatus('error');
      console.error('Failed to save scenes:', err);
    }
  },

  addScene: async (slug, sceneData) => {
    const { scenes } = get();
    const newOrder = scenes.length > 0 ? Math.max(...scenes.map(s => s.order || 0)) + 1 : 1;
    const now = new Date().toISOString();
    
    const newScene = {
      id: crypto.randomUUID(),
      title: 'New Scene',
      synopsis: '',
      location: 'INT',
      locationName: 'NEW LOCATION',
      timeOfDay: 'DAY',
      characters: [],
      tone: 'drama',
      order: newOrder,
      color: '#6B7FD4',
      conflictLevel: 2,
      createdAt: now,
      updatedAt: now,
      ...sceneData
    };

    set((state) => ({
      scenes: [...state.scenes, newScene]
    }));

    await get().saveScenes(slug);
    return newScene;
  },

  updateScene: async (slug, id, sceneData) => {
    set((state) => ({
      scenes: state.scenes.map((s) => 
        s.id === id 
          ? { ...s, ...sceneData, updatedAt: new Date().toISOString() } 
          : s
      )
    }));

    await get().saveScenes(slug);
  },

  deleteScene: async (slug, id) => {
    set((state) => ({
      scenes: state.scenes.filter((s) => s.id !== id)
    }));
    await get().saveScenes(slug);
  },

  reorderScenes: async (slug, updatedScenes) => {
    // Re-assign order based on array indices
    const ordered = updatedScenes.map((s, index) => ({
      ...s,
      order: index + 1
    }));
    
    set({ scenes: ordered });
    await get().saveScenes(slug);
  },

  addAct: async (slug, actLabel) => {
    const { acts } = get();
    const newOrder = acts.length > 0 ? Math.max(...acts.map(a => a.order || 0)) + 1 : 1;
    const colors = ['#E8C547', '#C24B2A', '#6B7FD4', '#4BA86B', '#D4742A', '#7A6B8A', '#6B8A9E'];
    const newAct = {
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      label: actLabel || `Act ${newOrder}`,
      color: colors[(newOrder - 1) % colors.length],
      order: newOrder
    };

    set((state) => ({
      acts: [...state.acts, newAct]
    }));
    await get().saveScenes(slug);
  },

  updateAct: async (slug, id, actData) => {
    set((state) => ({
      acts: state.acts.map((a) => (a.id === id ? { ...a, ...actData } : a))
    }));
    await get().saveScenes(slug);
  },

  deleteAct: async (slug, id) => {
    // Delete act and assign its scenes back to null or first act
    const { acts } = get();
    const remainingActs = acts.filter((a) => a.id !== id);
    const fallbackActId = remainingActs.length > 0 ? remainingActs[0].id : null;

    set((state) => ({
      acts: remainingActs,
      scenes: state.scenes.map((s) => s.act === id ? { ...s, act: fallbackActId } : s)
    }));
    await get().saveScenes(slug);
  },

  parseStoryToScenes: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const data = await scenesApi.parseStory(slug);
      set({
        acts: data.acts || [],
        scenes: data.scenes || [],
        isLoading: false
      });
      await get().saveScenes(slug);
    } catch (err) {
      set({ error: err.toString(), isLoading: false });
    }
  },

  // View settings toggles
  setBeatOverlayEnabled: (enabled) => set({ beatOverlayEnabled: enabled }),
  setEmotionArcEnabled: (enabled) => set({ emotionArcEnabled: enabled }),
  
  // Filter actions
  setFilterTone: (tone) => set({ filterTone: tone }),
  setFilterCharacter: (character) => set({ filterCharacter: character }),
  setFilterSearch: (search) => set({ filterSearch: search }),
  setSelectedSceneId: (id) => set({ selectedSceneId: id })
}));
