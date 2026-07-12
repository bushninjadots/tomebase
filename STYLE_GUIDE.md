# Style Guide

## Design Principles

- **Clean, modern aesthetics** — card-based layouts with subtle borders
- **Theme-aware** — all components use CSS variables, never hardcoded colors
- **Consistent spacing** — Tailwind spacing scale (4px increments)
- **Subtle interactions** — hover states, transitions, micro-animations

## Color System

All UI uses theme CSS variables:

| Purpose | Classes |
|---------|---------|
| Primary text | `text-theme-main` |
| Secondary text | `text-theme-subtle` |
| Muted text | `text-theme-muted` |
| Page background | `bg-theme-page` |
| Card background | `bg-theme-card` |
| Hover background | `bg-theme-hover` |
| Borders | `border-theme-border` |
| Accent (gold) | `text-theme-accent`, `bg-theme-accent` |
| Accent hover | `text-theme-accent-hover`, `bg-theme-accent-hover` |
| Accent light | `bg-theme-accent-light` |

**Never use** hardcoded Tailwind colors for UI elements. Use semantic colors:
- Green: success, published, health good
- Red: danger, errors, health bad
- Amber: warnings, health medium
- Blue: informational, links
- Purple: health score, graph

## Typography

- **Primary**: Geist (sans-serif)
- **Code**: Geist Mono (monospace)
- **Scale**: text-xs (12px), text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px)

## Border Radius

- Cards: `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px) or `rounded-xl` (12px)
- Avatars: `rounded-lg` (8px)
- Badges: `rounded-full`

## Spacing

- Card padding: `p-5` (20px)
- Section gaps: `gap-4` (16px)
- Item gaps: `gap-3` (12px)
- Tight gaps: `gap-2` (8px)

## Components

### Buttons
- Primary: `bg-theme-accent text-gray-900 hover:bg-theme-accent-hover`
- Secondary: `border border-theme-border bg-theme-card text-theme-main`
- Ghost: `text-theme-muted hover:text-theme-main hover:bg-theme-hover`
- Danger: `border border-red-500/30 bg-red-500/10 text-red-400`

### Cards
- Default: `border border-theme-border bg-theme-card rounded-xl`
- Interactive: add `hover:border-theme-accent/30 hover:bg-theme-hover transition-all`

### Stat Cards
- Subtle tinted background via `color-mix(in srgb, var(--color-{color}-500) 4%, transparent)`
- Large number as visual focus (`text-3xl font-bold`)
- Icon with category-colored background

## Themes

5 themes available: Dark (default), Light, Gruvbox, Dracula, Nord.

Theme variables are defined in `apps/web/app/globals.css`.
