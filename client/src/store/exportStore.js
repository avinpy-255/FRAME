import { create } from 'zustand';

export const useExportStore = create((set, get) => ({
  exportsList: [],
  snapshotsList: [],
  isLoading: false,
  error: null,

  fetchExports: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/projects/${slug}/exports`);
      if (!res.ok) throw new Error('Failed to fetch exports list');
      const data = await res.json();
      set({ exportsList: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  exportHtml: async (slug, options) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/projects/${slug}/export/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate Lookbook HTML');
      }
      const result = await res.json();
      // Reload list
      await get().fetchExports(slug);
      set({ isLoading: false });
      return result;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  exportFountain: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/projects/${slug}/export/fountain`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate Fountain script');
      }
      const result = await res.json();
      await get().fetchExports(slug);
      set({ isLoading: false });
      return result;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  exportPdf: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/projects/${slug}/export/pdf`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate PDF');
      }
      const result = await res.json();
      await get().fetchExports(slug);
      set({ isLoading: false });
      return result;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchSnapshots: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/projects/${slug}/snapshots`);
      if (!res.ok) throw new Error('Failed to fetch snapshots list');
      const data = await res.json();
      set({ snapshotsList: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  createSnapshot: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/projects/${slug}/snapshot`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to write snapshot');
      }
      const result = await res.json();
      await get().fetchSnapshots(slug);
      set({ isLoading: false });
      return result;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  }
}));
