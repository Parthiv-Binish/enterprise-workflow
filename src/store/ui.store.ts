import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type TaskViewMode = 'table' | 'kanban' | 'calendar';

interface UIState {
  sidebarCollapsed: boolean;
  taskView: TaskViewMode;
  theme: 'light' | 'dark';
  commandMenuOpen: boolean;

  toggleSidebar: () => void;
  setTaskView: (v: TaskViewMode) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setCommandMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      taskView: 'table',
      theme: typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
      commandMenuOpen: false,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTaskView: (taskView) => set({ taskView }),
      setTheme: (theme) => set({ theme }),
      setCommandMenuOpen: (commandMenuOpen) => set({ commandMenuOpen }),
    }),
    {
      name: 'workflow-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        taskView: s.taskView,
        theme: s.theme,
      }),
    }
  )
);
