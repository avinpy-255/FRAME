import { create } from 'zustand';
import { useUiStore } from './uiStore';

const charactersApi = {
  getCharacters: (slug) => fetch(`/api/projects/${slug}/characters`).then(r => r.ok ? r.json() : Promise.reject('Failed to load characters')),
  saveCharacters: (slug, data) => fetch(`/api/projects/${slug}/characters`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.ok ? r.json() : Promise.reject('Failed to save characters'))
};

export const useCharacterStore = create((set, get) => ({
  characters: [],
  highlightColorsEnabled: false,
  isLoading: false,
  error: null,

  fetchCharacters: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const data = await charactersApi.getCharacters(slug);
      set({ characters: data.characters || [], isLoading: false });
    } catch (err) {
      set({ error: err.toString(), isLoading: false });
    }
  },

  saveCharacters: async (slug) => {
    const { characters } = get();
    const setAutosaveStatus = useUiStore.getState().setAutosaveStatus;

    setAutosaveStatus('saving');
    try {
      await charactersApi.saveCharacters(slug, { characters });
      setAutosaveStatus('saved');
    } catch (err) {
      setAutosaveStatus('error');
      console.error('Failed to save characters:', err);
    }
  },

  addCharacter: async (slug, characterData) => {
    const { characters } = get();
    const colors = ['#E8C547', '#C24B2A', '#6B7FD4', '#4BA86B', '#D4742A', '#7A6B8A', '#6B8A9E'];
    
    const newCharacter = {
      id: crypto.randomUUID(),
      name: 'NEW CHARACTER',
      displayName: 'New Character',
      age: '',
      role: 'supporting',
      bio: '',
      arc: '',
      color: colors[characters.length % colors.length],
      imagePath: null,
      firstScene: '',
      traits: [],
      notes: '',
      ...characterData
    };

    set((state) => ({
      characters: [...state.characters, newCharacter]
    }));

    await get().saveCharacters(slug);
    return newCharacter;
  },

  updateCharacter: async (slug, id, characterData) => {
    set((state) => ({
      characters: state.characters.map((c) => (c.id === id ? { ...c, ...characterData } : c))
    }));
    await get().saveCharacters(slug);
  },

  deleteCharacter: async (slug, id) => {
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id)
    }));
    await get().saveCharacters(slug);
  },

  setHighlightColorsEnabled: (enabled) => set({ highlightColorsEnabled: enabled })
}));
