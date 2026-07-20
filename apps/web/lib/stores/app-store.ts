import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'gruvbox' | 'dracula' | 'nord'

export interface AppSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  team?: {
    id: string
    name: string
    tier: string
  } | null
}

export interface AppToast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface AppState {
  session: AppSession | null
  theme: Theme
  toasts: AppToast[]
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  activeModal: string | null

  setSession: (session: AppSession | null) => void
  setTheme: (theme: Theme) => void
  addToast: (type: AppToast['type'], message: string) => void
  removeToast: (id: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  openModal: (id: string) => void
  closeModal: () => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  session: null,
  theme: 'dark',
  toasts: [],
  sidebarOpen: false,
  commandPaletteOpen: false,
  activeModal: null,

  setSession: (session) => set({ session }),

  setTheme: (theme) => set({ theme }),

  addToast: (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, type, message }],
    }))
    return id
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  openModal: (id) => set({ activeModal: id }),

  closeModal: () => set({ activeModal: null }),
}))

export function selectSession(state: AppState) {
  return state.session
}

export function selectTheme(state: AppState) {
  return state.theme
}

export function selectToasts(state: AppState) {
  return state.toasts
}

export function selectSidebarOpen(state: AppState) {
  return state.sidebarOpen
}

export function selectCommandPaletteOpen(state: AppState) {
  return state.commandPaletteOpen
}

export function selectActiveModal(state: AppState) {
  return state.activeModal
}

export function selectIsAuthenticated(state: AppState) {
  return state.session !== null
}

export function selectUser(state: AppState) {
  return state.session?.user ?? null
}

export function selectTier(state: AppState) {
  return state.session?.team?.tier ?? 'free'
}
