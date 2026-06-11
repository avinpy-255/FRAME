import { create } from 'zustand';
import { useUiStore } from './uiStore';

const screenplayApi = {
  getScreenplay: (slug) => fetch(`/api/projects/${slug}/screenplay`).then(r => r.ok ? r.json() : Promise.reject('Failed to load screenplay')),
  saveScreenplay: (slug, data) => fetch(`/api/projects/${slug}/screenplay`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.ok ? r.json() : Promise.reject('Failed to save screenplay'))
};

export const useScreenplayStore = create((set, get) => ({
  elements: [],
  title: '',
  author: '',
  draftNumber: 1,
  revisionHistory: [],
  activeSceneHeadingId: null,
  
  isLoading: false,
  error: null,

  fetchScreenplay: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const data = await screenplayApi.getScreenplay(slug);
      set({
        elements: data.elements || [],
        title: data.title || '',
        author: data.author || '',
        draftNumber: data.draftNumber || 1,
        revisionHistory: data.revisionHistory || [],
        isLoading: false
      });
    } catch (err) {
      set({ error: err.toString(), isLoading: false });
    }
  },

  saveScreenplay: async (slug) => {
    const { elements, title, author, draftNumber, revisionHistory } = get();
    const setAutosaveStatus = useUiStore.getState().setAutosaveStatus;

    setAutosaveStatus('saving');
    try {
      const payload = {
        elements,
        title,
        author,
        draftNumber,
        revisionHistory
      };
      await screenplayApi.saveScreenplay(slug, payload);
      setAutosaveStatus('saved');
    } catch (err) {
      setAutosaveStatus('error');
      console.error('Failed to save screenplay:', err);
    }
  },

  updateElement: async (slug, id, updateFields) => {
    set((state) => ({
      elements: state.elements.map((el) => 
        el.id === id 
          ? { ...el, ...updateFields } 
          : el
      )
    }));
    await get().saveScreenplay(slug);
  },

  insertElement: async (slug, index, element) => {
    set((state) => {
      const newElements = [...state.elements];
      newElements.splice(index, 0, {
        id: crypto.randomUUID(),
        type: 'action',
        content: '',
        order: index,
        sceneId: null,
        locked: false,
        ...element
      });
      return { elements: newElements };
    });
    await get().saveScreenplay(slug);
  },

  deleteElement: async (slug, id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id)
    }));
    await get().saveScreenplay(slug);
  },

  setElements: async (slug, elements) => {
    set({ elements });
    await get().saveScreenplay(slug);
  },

  setActiveSceneHeadingId: (id) => set({ activeSceneHeadingId: id })
}));
