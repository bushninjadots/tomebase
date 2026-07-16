'use client';

import { useTheme, THEMES } from '@/components/theme-provider';
import { Palette, Monitor, Sun, Moon, Sparkles } from 'lucide-react';

const THEME_ICONS: Record<string, typeof Sun> = {
  light: Sun,
  dark: Moon,
  gruvbox: Sparkles,
  dracula: Sparkles,
  nord: Sparkles,
};

const THEME_PREVIEWS: Record<string, string> = {
  light: 'bg-white border-gray-200',
  dark: 'bg-[#141419] border-white/10',
  gruvbox: 'bg-[#3c3836] border-[#504945]',
  dracula: 'bg-[#44475a] border-[#6272a4]',
  nord: 'bg-[#3b4252] border-[#4c566a]',
};

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Palette className="h-4 w-4 text-theme-muted" />
        <h2 className="text-sm font-semibold text-theme-main">Appearance</h2>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {THEMES.map((t) => {
          const Icon = THEME_ICONS[t.id] ?? Monitor;
          const isActive = theme === t.id;
          const preview = THEME_PREVIEWS[t.id] ?? 'bg-theme-card border-theme-border';

          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`group flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-150 ${
                isActive
                  ? 'bg-theme-accent/10 border border-theme-accent/25'
                  : 'border border-transparent hover:bg-theme-hover hover:border-theme-border'
              }`}
            >
              <div className={`w-full aspect-[4/3] rounded-lg ${preview} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-theme-accent' : 'text-theme-muted group-hover:text-theme-main'} transition-colors`} />
              </div>
              <span className={`text-[11px] font-medium ${isActive ? 'text-theme-accent' : 'text-theme-muted'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-theme-muted mt-3">
        Theme is saved locally in your browser.
      </p>
    </div>
  );
}
