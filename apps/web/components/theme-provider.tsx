'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'gruvbox' | 'dracula' | 'nord';

export const THEMES = [
  { id: 'light' as Theme, label: 'Light' },
  { id: 'dark' as Theme, label: 'Dark' },
  { id: 'gruvbox' as Theme, label: 'Gruvbox' },
  { id: 'dracula' as Theme, label: 'Dracula' },
  { id: 'nord' as Theme, label: 'Nord' },
];

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void; themes: { id: Theme; label: string }[] }>({
  theme: 'dark',
  setTheme: () => {},
  themes: THEMES,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('fluid-theme');
  if (stored && ['light', 'dark', 'gruvbox', 'dracula', 'nord'].includes(stored)) return stored as Theme;
  return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getInitialTheme());
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('fluid-theme', t);
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    if (t === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    setTimeout(() => window.location.reload(), 50);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem('fluid-theme', theme);
  }, [theme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
