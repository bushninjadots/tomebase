import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  registerContextProvider,
  unregisterContextProvider,
  setContextEnabled,
  isContextEnabled,
  collectContext,
  contributionsToString,
  clearAllProviders,
} from './context'

describe('context manager', () => {
  beforeEach(() => {
    clearAllProviders()
    setContextEnabled(true)
  })

  describe('registerContextProvider', () => {
    it('returns unregister function', () => {
      const unregister = registerContextProvider('test', () => ({
        key: 'test',
        label: 'Test',
        priority: 10,
        content: 'hello',
      }))
      expect(typeof unregister).toBe('function')
      unregister()
    })
  })

  describe('collectContext', () => {
    it('collects contributions from registered providers', async () => {
      registerContextProvider('a', () => ({
        key: 'a', label: 'A', priority: 20, content: 'from A',
      }))
      registerContextProvider('b', () => ({
        key: 'b', label: 'B', priority: 10, content: 'from B',
      }))

      const contributions = await collectContext()
      expect(contributions).toHaveLength(2)
      expect(contributions[0]!.label).toBe('B')
      expect(contributions[1]!.label).toBe('A')
    })

    it('sorts by priority', async () => {
      registerContextProvider('z', () => ({
        key: 'z', label: 'Z', priority: 1, content: '',
      }))
      registerContextProvider('a', () => ({
        key: 'a', label: 'A', priority: 100, content: '',
      }))

      const contributions = await collectContext()
      expect(contributions[0]!.key).toBe('z')
      expect(contributions[1]!.key).toBe('a')
    })

    it('skips providers that return null', async () => {
      registerContextProvider('a', () => null)
      registerContextProvider('b', () => ({
        key: 'b', label: 'B', priority: 0, content: 'ok',
      }))

      const contributions = await collectContext()
      expect(contributions).toHaveLength(1)
      expect(contributions[0]!.key).toBe('b')
    })

    it('skips providers that throw', async () => {
      registerContextProvider('a', () => { throw new Error('fail') })
      registerContextProvider('b', () => ({
        key: 'b', label: 'B', priority: 0, content: 'ok',
      }))

      const contributions = await collectContext()
      expect(contributions).toHaveLength(1)
      expect(contributions[0]!.key).toBe('b')
    })

    it('handles async providers', async () => {
      registerContextProvider('a', async () => ({
        key: 'a', label: 'A', priority: 0, content: 'async',
      }))

      const contributions = await collectContext()
      expect(contributions).toHaveLength(1)
      expect(contributions[0]!.content).toBe('async')
    })

    it('returns empty when disabled', async () => {
      registerContextProvider('a', () => ({
        key: 'a', label: 'A', priority: 0, content: 'data',
      }))
      setContextEnabled(false)

      const contributions = await collectContext()
      expect(contributions).toHaveLength(0)
    })
  })

  describe('unregisterContextProvider', () => {
    it('removes provider', async () => {
      const unregister = registerContextProvider('test', () => ({
        key: 'test', label: 'Test', priority: 0, content: 'data',
      }))
      let contributions = await collectContext()
      expect(contributions).toHaveLength(1)

      unregister()
      contributions = await collectContext()
      expect(contributions).toHaveLength(0)
    })
  })

  describe('contributionsToString', () => {
    it('returns empty string for empty array', () => {
      expect(contributionsToString([])).toBe('')
    })

    it('formats contributions', () => {
      const result = contributionsToString([
        { key: 'page', label: 'Current Page', priority: 10, content: 'Page content here' },
        { key: 'health', label: 'Health', priority: 20, content: 'Score: 85/100' },
      ])
      expect(result).toContain('DOCUMENTATION CONTEXT')
      expect(result).toContain('[Current Page]')
      expect(result).toContain('Page content here')
      expect(result).toContain('[Health]')
      expect(result).toContain('Score: 85/100')
      expect(result).toContain('END CONTEXT')
    })
  })

  describe('clearAllProviders', () => {
    it('removes all providers', async () => {
      registerContextProvider('a', () => ({
        key: 'a', label: 'A', priority: 0, content: 'data',
      }))
      registerContextProvider('b', () => ({
        key: 'b', label: 'B', priority: 0, content: 'data',
      }))
      expect(await collectContext()).toHaveLength(2)

      clearAllProviders()
      expect(await collectContext()).toHaveLength(0)
    })
  })

  describe('setContextEnabled / isContextEnabled', () => {
    it('defaults to enabled', () => {
      expect(isContextEnabled()).toBe(true)
    })

    it('toggles', () => {
      setContextEnabled(false)
      expect(isContextEnabled()).toBe(false)
      setContextEnabled(true)
      expect(isContextEnabled()).toBe(true)
    })
  })
})
