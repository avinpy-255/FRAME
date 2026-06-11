import { create } from 'zustand';
import { api } from '../lib/api';

export const useProjectStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await api.getProjects();
      set({ projects, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadProject: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const activeProject = await api.getProject(slug);
      set({ activeProject, isLoading: false });
      return activeProject;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  createProject: async (projectData) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = await api.createProject(projectData);
      set((state) => ({
        projects: [newProject, ...state.projects],
        activeProject: newProject,
        isLoading: false,
      }));
      return newProject;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateProject: async (slug, updatedData) => {
    try {
      const updated = await api.updateProject(slug, updatedData);
      set((state) => ({
        projects: state.projects.map((p) => (p.slug === slug ? updated : p)),
        activeProject: state.activeProject?.slug === slug ? updated : state.activeProject,
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteProject: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteProject(slug);
      set((state) => ({
        projects: state.projects.filter((p) => p.slug !== slug),
        activeProject: state.activeProject?.slug === slug ? null : state.activeProject,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setActiveProject: (project) => {
    set({ activeProject: project });
  },
}));
