import { describe, it, expect, beforeEach } from 'vitest'
import {
  useAppStore,
  selectSession,
  selectTheme,
  selectToasts,
  selectSidebarOpen,
  selectCommandPaletteOpen,
  selectActiveModal,
  selectIsAuthenticated,
  selectUser,
  selectTier,
} from './app-store'
import type { AppSession, Theme } from './app-store'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      session: null,
      theme: 'dark',
      toasts: [],
      sidebarOpen: false,
      commandPaletteOpen: false,
      activeModal: null,
    })
  })

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useAppStore.getState()
      expect(state.session).toBeNull()
      expect(state.theme).toBe('dark')
      expect(state.toasts).toEqual([])
      expect(state.sidebarOpen).toBe(false)
      expect(state.commandPaletteOpen).toBe(false)
      expect(state.activeModal).toBeNull()
    })
  })

  describe('session', () => {
    it('sets session', () => {
      const session: AppSession = {
        user: { id: 'u1', name: 'Test', email: 'test@example.com', image: null },
        team: { id: 't1', name: 'My Team', tier: 'pro' },
      }
      useAppStore.getState().setSession(session)
      expect(useAppStore.getState().session).toEqual(session)
    })

    it('clears session', () => {
      useAppStore.getState().setSession({
        user: { id: 'u1', name: 'Test', email: 'test@example.com', image: null },
      })
      useAppStore.getState().setSession(null)
      expect(useAppStore.getState().session).toBeNull()
    })

    it('handles session with null team', () => {
      const session: AppSession = {
        user: { id: 'u1', name: 'Test', email: 'test@example.com', image: null },
        team: null,
      }
      useAppStore.getState().setSession(session)
      expect(useAppStore.getState().session?.team).toBeNull()
    })

    it('handles session without optional fields', () => {
      const session: AppSession = {
        user: { id: 'u1', name: null, email: null, image: null },
      }
      useAppStore.getState().setSession(session)
      expect(useAppStore.getState().session?.user.name).toBeNull()
      expect(useAppStore.getState().session?.user.email).toBeNull()
    })
  })

  describe('theme', () => {
    it('sets theme', () => {
      const themes: Theme[] = ['light', 'dark', 'gruvbox', 'dracula', 'nord']
      for (const theme of themes) {
        useAppStore.getState().setTheme(theme)
        expect(useAppStore.getState().theme).toBe(theme)
      }
    })
  })

  describe('toasts', () => {
    it('adds a toast', () => {
      useAppStore.getState().addToast('success', 'It worked')
      const toasts = useAppStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0]?.type).toBe('success')
      expect(toasts[0]?.message).toBe('It worked')
      expect(toasts[0]?.id).toBeTruthy()
    })

    it('adds multiple toasts', () => {
      useAppStore.getState().addToast('success', 'First')
      useAppStore.getState().addToast('error', 'Second')
      useAppStore.getState().addToast('info', 'Third')
      expect(useAppStore.getState().toasts).toHaveLength(3)
    })

    it('removes a toast by id', () => {
      useAppStore.getState().addToast('success', 'Keep me')
      useAppStore.getState().addToast('error', 'Remove me')
      const toasts = useAppStore.getState().toasts
      const removeId = toasts[1]!.id

      useAppStore.getState().removeToast(removeId)
      const remaining = useAppStore.getState().toasts
      expect(remaining).toHaveLength(1)
      expect(remaining[0]?.message).toBe('Keep me')
    })

    it('keeps at most 5 toasts', () => {
      for (let i = 0; i < 8; i++) {
        useAppStore.getState().addToast('info', `Toast ${i}`)
      }
      const toasts = useAppStore.getState().toasts
      expect(toasts).toHaveLength(5)
      expect(toasts[0]?.message).toBe('Toast 3')
      expect(toasts[4]?.message).toBe('Toast 7')
    })

    it('generates unique ids', () => {
      useAppStore.getState().addToast('success', 'First')
      useAppStore.getState().addToast('success', 'Second')
      const toasts = useAppStore.getState().toasts
      expect(toasts[0]?.id).not.toBe(toasts[1]?.id)
    })
  })

  describe('sidebar', () => {
    it('sets sidebar open', () => {
      useAppStore.getState().setSidebarOpen(true)
      expect(useAppStore.getState().sidebarOpen).toBe(true)
    })

    it('sets sidebar closed', () => {
      useAppStore.getState().setSidebarOpen(true)
      useAppStore.getState().setSidebarOpen(false)
      expect(useAppStore.getState().sidebarOpen).toBe(false)
    })

    it('toggles sidebar', () => {
      expect(useAppStore.getState().sidebarOpen).toBe(false)
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarOpen).toBe(true)
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarOpen).toBe(false)
    })
  })

  describe('command palette', () => {
    it('sets command palette open', () => {
      useAppStore.getState().setCommandPaletteOpen(true)
      expect(useAppStore.getState().commandPaletteOpen).toBe(true)
    })

    it('sets command palette closed', () => {
      useAppStore.getState().setCommandPaletteOpen(true)
      useAppStore.getState().setCommandPaletteOpen(false)
      expect(useAppStore.getState().commandPaletteOpen).toBe(false)
    })

    it('toggles command palette', () => {
      expect(useAppStore.getState().commandPaletteOpen).toBe(false)
      useAppStore.getState().toggleCommandPalette()
      expect(useAppStore.getState().commandPaletteOpen).toBe(true)
      useAppStore.getState().toggleCommandPalette()
      expect(useAppStore.getState().commandPaletteOpen).toBe(false)
    })
  })

  describe('modal', () => {
    it('opens a modal', () => {
      useAppStore.getState().openModal('publish')
      expect(useAppStore.getState().activeModal).toBe('publish')
    })

    it('closes modal', () => {
      useAppStore.getState().openModal('publish')
      useAppStore.getState().closeModal()
      expect(useAppStore.getState().activeModal).toBeNull()
    })

    it('replaces modal when opening another', () => {
      useAppStore.getState().openModal('publish')
      useAppStore.getState().openModal('delete')
      expect(useAppStore.getState().activeModal).toBe('delete')
    })

    it('closeModal when no modal is open is safe', () => {
      expect(useAppStore.getState().activeModal).toBeNull()
      expect(() => useAppStore.getState().closeModal()).not.toThrow()
      expect(useAppStore.getState().activeModal).toBeNull()
    })
  })
})

describe('selectors', () => {
  beforeEach(() => {
    useAppStore.setState({
      session: {
        user: { id: 'u1', name: 'Alice', email: 'alice@example.com', image: null },
        team: { id: 't1', name: 'Acme', tier: 'pro' },
      },
      theme: 'dracula',
      toasts: [],
      sidebarOpen: true,
      commandPaletteOpen: false,
      activeModal: 'settings',
    })
  })

  it('selectSession returns session', () => {
    expect(selectSession(useAppStore.getState())).toEqual(useAppStore.getState().session)
  })

  it('selectTheme returns theme', () => {
    expect(selectTheme(useAppStore.getState())).toBe('dracula')
  })

  it('selectToasts returns toasts', () => {
    expect(selectToasts(useAppStore.getState())).toHaveLength(0)
  })

  it('selectSidebarOpen returns sidebar state', () => {
    expect(selectSidebarOpen(useAppStore.getState())).toBe(true)
  })

  it('selectCommandPaletteOpen returns palette state', () => {
    expect(selectCommandPaletteOpen(useAppStore.getState())).toBe(false)
  })

  it('selectActiveModal returns modal id', () => {
    expect(selectActiveModal(useAppStore.getState())).toBe('settings')
  })

  it('selectIsAuthenticated returns true when session exists', () => {
    expect(selectIsAuthenticated(useAppStore.getState())).toBe(true)
  })

  it('selectIsAuthenticated returns false when no session', () => {
    useAppStore.setState({ session: null })
    expect(selectIsAuthenticated(useAppStore.getState())).toBe(false)
  })

  it('selectUser returns user', () => {
    expect(selectUser(useAppStore.getState())?.id).toBe('u1')
  })

  it('selectUser returns null when no session', () => {
    useAppStore.setState({ session: null })
    expect(selectUser(useAppStore.getState())).toBeNull()
  })

  it('selectTier returns team tier', () => {
    expect(selectTier(useAppStore.getState())).toBe('pro')
  })

  it('selectTier returns free when no team', () => {
    useAppStore.setState({ session: { user: { id: 'u1', name: null, email: null, image: null }, team: null } })
    expect(selectTier(useAppStore.getState())).toBe('free')
  })

  it('selectTier returns free when no session', () => {
    useAppStore.setState({ session: null })
    expect(selectTier(useAppStore.getState())).toBe('free')
  })
})

describe('type safety', () => {
  it('session accepts valid shape', () => {
    const session: AppSession = {
      user: { id: '1', name: 'Test', email: 'test@test.com', image: null },
      team: { id: 't1', name: 'Team', tier: 'free' },
    }
    useAppStore.getState().setSession(session)
    expect(useAppStore.getState().session).toEqual(session)
  })

  it('theme accepts valid values', () => {
    const validThemes: Theme[] = ['light', 'dark', 'gruvbox', 'dracula', 'nord']
    for (const t of validThemes) {
      useAppStore.getState().setTheme(t)
      expect(useAppStore.getState().theme).toBe(t)
    }
  })

  it('addToast accepts valid types', () => {
    useAppStore.setState({ toasts: [] })
    const types: Array<'success' | 'error' | 'info'> = ['success', 'error', 'info']
    for (const type of types) {
      useAppStore.getState().addToast(type, `test ${type}`)
    }
    expect(useAppStore.getState().toasts).toHaveLength(3)
  })
})
