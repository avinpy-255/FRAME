import { create } from 'zustand';
import { useUiStore } from './uiStore';

const researchApi = {
  getResearch: (slug) => fetch(`/api/projects/${slug}/research`).then(r => r.ok ? r.json() : Promise.reject('Failed to load research')),
  saveResearch: (slug, data) => fetch(`/api/projects/${slug}/research`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.ok ? r.json() : Promise.reject('Failed to save research')),
  scrapeUrl: (slug, url) => fetch(`/api/projects/${slug}/research/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  }).then(r => r.ok ? r.json() : Promise.reject('Failed to scrape URL'))
};

export const useResearchStore = create((set, get) => ({
  items: [],
  boards: [],
  activeBoardId: 'all',
  
  isLoading: false,
  error: null,

  fetchResearch: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const data = await researchApi.getResearch(slug);
      
      // If there are no boards, initialize a default "Mood Board"
      let boards = data.boards || [];
      if (boards.length === 0) {
        boards = [{ id: 'mood-board', name: 'Mood Board', color: '#E8C547', itemIds: [] }];
      }

      set({ 
        items: data.items || [], 
        boards, 
        isLoading: false 
      });
    } catch (err) {
      set({ error: err.toString(), isLoading: false });
    }
  },

  saveResearch: async (slug) => {
    const { items, boards } = get();
    const setAutosaveStatus = useUiStore.getState().setAutosaveStatus;

    setAutosaveStatus('saving');
    try {
      await researchApi.saveResearch(slug, { items, boards });
      setAutosaveStatus('saved');
    } catch (err) {
      setAutosaveStatus('error');
      console.error('Failed to save research:', err);
    }
  },

  addResearchItem: async (slug, itemData) => {
    const { items, activeBoardId, boards } = get();
    const newItem = {
      id: crypto.randomUUID(),
      type: 'note', // 'image' | 'link' | 'note' | 'color-swatch'
      title: 'New Item',
      content: '',
      filePath: null,
      tags: [],
      linkedScenes: [],
      createdAt: new Date().toISOString(),
      ...itemData
    };

    set((state) => ({
      items: [...state.items, newItem]
    }));

    // If active board is not 'all', link item to the active board
    if (activeBoardId !== 'all') {
      set((state) => ({
        boards: state.boards.map((b) => 
          b.id === activeBoardId 
            ? { ...b, itemIds: [...(b.itemIds || []), newItem.id] } 
            : b
        )
      }));
    }

    await get().saveResearch(slug);
    return newItem;
  },

  updateResearchItem: async (slug, id, itemData) => {
    set((state) => ({
      items: state.items.map((it) => (it.id === id ? { ...it, ...itemData } : it))
    }));
    await get().saveResearch(slug);
  },

  deleteResearchItem: async (slug, id) => {
    set((state) => ({
      items: state.items.filter((it) => it.id !== id),
      // Clean up item reference in all boards
      boards: state.boards.map((b) => ({
        ...b,
        itemIds: (b.itemIds || []).filter((itemId) => itemId !== id)
      }))
    }));
    await get().saveResearch(slug);
  },

  addBoard: async (slug, boardName) => {
    const { boards } = get();
    const colors = ['#E8C547', '#C24B2A', '#6B7FD4', '#4BA86B', '#D4742A', '#7A6B8A', '#6B8A9E'];
    const newBoard = {
      id: `board-${crypto.randomUUID().slice(0, 8)}`,
      name: boardName,
      color: colors[boards.length % colors.length],
      itemIds: []
    };

    set((state) => ({
      boards: [...state.boards, newBoard],
      activeBoardId: newBoard.id // Switch to newly created board
    }));
    await get().saveResearch(slug);
  },

  deleteBoard: async (slug, id) => {
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== id),
      activeBoardId: state.activeBoardId === id ? 'all' : state.activeBoardId
    }));
    await get().saveResearch(slug);
  },

  setActiveBoardId: (id) => set({ activeBoardId: id }),

  scrapeUrl: async (slug, url) => {
    return researchApi.scrapeUrl(slug, url);
  }
}));
