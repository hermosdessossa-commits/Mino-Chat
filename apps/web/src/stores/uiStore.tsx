import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect } from 'react';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  activeModal: string | null;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
  modalData: any;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      activeModal: null,
      openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
      modalData: null,
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'mino-chat-ui',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {children}
    </div>
  );
}

export function useTheme() {
  const { theme } = useUIStore();
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
}