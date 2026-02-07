import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return theme;
}

export function applyThemeToDocument(effective: 'light' | 'dark') {
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effective: 'light' | 'dark';
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      effective: 'light',

      setTheme: (theme: Theme) => {
        const effective = typeof window !== 'undefined' ? getEffectiveTheme(theme) : (theme === 'dark' ? 'dark' : 'light');
        if (typeof document !== 'undefined') applyThemeToDocument(effective);
        set({ theme, effective });
      },

      toggle: () => {
        const { effective } = get();
        const next: 'light' | 'dark' = effective === 'dark' ? 'light' : 'dark';
        if (typeof document !== 'undefined') applyThemeToDocument(next);
        set({ theme: next, effective: next });
      },
    }),
    { name: 'odev-theme' }
  )
);
