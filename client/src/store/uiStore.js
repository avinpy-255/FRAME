import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarExpanded: false,
  focusMode: false,
  theme: 'dark',
  autosaveStatus: 'saved', // 'idle' | 'saving' | 'saved' | 'error'
  aiPanelOpen: false,
  mobileSidebarOpen: false,

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
  
  setFocusMode: (focusMode) => set({ focusMode }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  
  setTheme: (theme) => set({ theme }),
  setAutosaveStatus: (autosaveStatus) => set({ autosaveStatus }),
  
  setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
  toggleAiPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),

  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
}));
