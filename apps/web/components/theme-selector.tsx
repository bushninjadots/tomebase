'use client';

import { useTheme } from './theme-provider';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const themeIcons: Record<string, string> = {
  light: '☀️',
  dark: '🌙',
  gruvbox: '🟫',
  dracula: '🟣',
  nord: '❄️',
};

export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  const current = themes.find((t) => t.id === theme)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        title="Change theme"
      >
        <span className="text-xs">{themeIcons[theme]}</span>
        <span className="hidden sm:inline text-xs font-medium">{current.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  t.id === theme
                    ? 'bg-fluid-50 text-fluid-700 dark:bg-fluid-900/30 dark:text-fluid-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="text-xs">{themeIcons[t.id]}</span>
                <span className="flex-1 text-left">{t.label}</span>
                {t.id === theme && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
