import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TypedEventBus } from './event-bus'
import type { EventBusEvents } from './types'

describe('TypedEventBus', () => {
  let bus: TypedEventBus

  beforeEach(() => {
    bus = new TypedEventBus()
  })

  describe('on / emit', () => {
    it('delivers event to a single listener', () => {
      const handler = vi.fn()
      bus.on('page:created', handler)

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })

      expect(handler).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledWith({ pageId: 'p1', projectId: 'proj1' })
    })

    it('delivers event to multiple listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bus.on('page:created', handler1)
      bus.on('page:created', handler2)

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })

      expect(handler1).toHaveBeenCalledOnce()
      expect(handler2).toHaveBeenCalledOnce()
    })

    it('does not deliver events to unrelated listeners', () => {
      const handler = vi.fn()
      bus.on('page:deleted', handler)

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })

      expect(handler).not.toHaveBeenCalled()
    })

    it('delivers different events to separate listeners', () => {
      const createdHandler = vi.fn()
      const deletedHandler = vi.fn()
      bus.on('page:created', createdHandler)
      bus.on('page:deleted', deletedHandler)

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })

      expect(createdHandler).toHaveBeenCalledOnce()
      expect(deletedHandler).not.toHaveBeenCalled()
    })

    it('handles emit with no listeners without throwing', () => {
      expect(() => {
        bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })
      }).not.toThrow()
    })
  })

  describe('off', () => {
    it('removes a specific listener', () => {
      const handler = vi.fn()
      bus.on('page:created', handler)
      bus.off('page:created', handler)

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })

      expect(handler).not.toHaveBeenCalled()
    })

    it('does not remove other listeners for the same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bus.on('page:created', handler1)
      bus.on('page:created', handler2)
      bus.off('page:created', handler1)

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledOnce()
    })

    it('is safe to call off for a listener that was never added', () => {
      const handler = vi.fn()
      expect(() => {
        bus.off('page:created', handler)
      }).not.toThrow()
    })

    it('is safe to call off twice for the same listener', () => {
      const handler = vi.fn()
      bus.on('page:created', handler)
      bus.off('page:created', handler)
      expect(() => {
        bus.off('page:created', handler)
      }).not.toThrow()
    })
  })

  describe('unsubscribe via returned function', () => {
    it('removes listener when unsubscribe is called', () => {
      const handler = vi.fn()
      const unsubscribe = bus.on('page:created', handler)

      unsubscribe()

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })
      expect(handler).not.toHaveBeenCalled()
    })

    it('calling unsubscribe twice is safe', () => {
      const handler = vi.fn()
      const unsubscribe = bus.on('page:created', handler)

      unsubscribe()
      expect(() => {
        unsubscribe()
      }).not.toThrow()
    })

    it('unsubscribe only removes its own listener', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const unsubscribe1 = bus.on('page:created', handler1)
      bus.on('page:created', handler2)

      unsubscribe1()

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledOnce()
    })
  })

  describe('listenerCount', () => {
    it('returns 0 for an event with no listeners', () => {
      expect(bus.listenerCount('page:created')).toBe(0)
    })

    it('returns correct count for an event', () => {
      bus.on('page:created', vi.fn())
      bus.on('page:created', vi.fn())
      bus.on('page:deleted', vi.fn())

      expect(bus.listenerCount('page:created')).toBe(2)
      expect(bus.listenerCount('page:deleted')).toBe(1)
    })

    it('returns total listener count when no event specified', () => {
      bus.on('page:created', vi.fn())
      bus.on('page:created', vi.fn())
      bus.on('page:deleted', vi.fn())

      expect(bus.listenerCount()).toBe(3)
    })

    it('updates after unsubscribe', () => {
      const handler = vi.fn()
      const unsubscribe = bus.on('page:created', handler)

      expect(bus.listenerCount('page:created')).toBe(1)
      unsubscribe()
      expect(bus.listenerCount('page:created')).toBe(0)
    })
  })

  describe('removeAllListeners', () => {
    it('removes all listeners for a specific event', () => {
      bus.on('page:created', vi.fn())
      bus.on('page:created', vi.fn())
      bus.on('page:deleted', vi.fn())

      bus.removeAllListeners('page:created')

      expect(bus.listenerCount('page:created')).toBe(0)
      expect(bus.listenerCount('page:deleted')).toBe(1)
    })

    it('removes all listeners for all events', () => {
      bus.on('page:created', vi.fn())
      bus.on('page:deleted', vi.fn())
      bus.on('document:saved', vi.fn())

      bus.removeAllListeners()

      expect(bus.listenerCount()).toBe(0)
    })
  })

  describe('event payload typing', () => {
    it('enforces correct payload shape at compile time', () => {
      bus.on('page:created', (payload) => {
        const _: string = payload.pageId
        const _2: string = payload.projectId
      })

      bus.on('health:scanned', (payload) => {
        const _: string = payload.projectId
        const _2: number = payload.score
        const _3: number | null = payload.previousScore
      })

      bus.on('import:completed', (payload) => {
        const _: string = payload.projectId
        const _2: 'code' | 'openapi' | 'github' = payload.type
        const _3: number = payload.pagesCreated
      })

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })
      bus.emit('health:scanned', { projectId: 'proj1', score: 85, previousScore: null })
      bus.emit('import:completed', { projectId: 'proj1', type: 'code', pagesCreated: 5 })
    })

    it('rejects wrong payload shape at compile time', () => {
      bus.on('page:created', (payload) => {
        // @ts-expect-error - wrong type for pageId
        const _: number = payload.pageId
      })
    })
  })

  describe('multiple event types', () => {
    it('handles all event categories', () => {
      const handlers = {
        page: vi.fn(),
        document: vi.fn(),
        project: vi.fn(),
        health: vi.fn(),
        diagnostic: vi.fn(),
        import: vi.fn(),
        sync: vi.fn(),
        ai: vi.fn(),
      }

      bus.on('page:created', handlers.page)
      bus.on('document:saved', handlers.document)
      bus.on('project:published', handlers.project)
      bus.on('health:scanned', handlers.health)
      bus.on('diagnostic:fixed', handlers.diagnostic)
      bus.on('import:completed', handlers.import)
      bus.on('sync:completed', handlers.sync)
      bus.on('ai:response', handlers.ai)

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })
      bus.emit('document:saved', { pageId: 'p1', content: 'hello', snapshotId: 's1' })
      bus.emit('project:published', { projectId: 'proj1' })
      bus.emit('health:scanned', { projectId: 'proj1', score: 90, previousScore: 85 })
      bus.emit('diagnostic:fixed', { projectId: 'proj1', pageId: 'p1', diagnosticId: 'd1' })
      bus.emit('import:completed', { projectId: 'proj1', type: 'openapi', pagesCreated: 10 })
      bus.emit('sync:completed', { projectId: 'proj1', created: 3, updated: 1 })
      bus.emit('ai:response', { operation: 'chat', content: 'response', tokens: 42 })

      expect(handlers.page).toHaveBeenCalledOnce()
      expect(handlers.document).toHaveBeenCalledOnce()
      expect(handlers.project).toHaveBeenCalledOnce()
      expect(handlers.health).toHaveBeenCalledOnce()
      expect(handlers.diagnostic).toHaveBeenCalledOnce()
      expect(handlers.import).toHaveBeenCalledOnce()
      expect(handlers.sync).toHaveBeenCalledOnce()
      expect(handlers.ai).toHaveBeenCalledOnce()
    })
  })

  describe('isolated instances', () => {
    it('different bus instances do not share listeners', () => {
      const bus1 = new TypedEventBus()
      const bus2 = new TypedEventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      bus1.on('page:created', handler1)
      bus2.on('page:created', handler2)

      bus1.emit('page:created', { pageId: 'p1', projectId: 'proj1' })

      expect(handler1).toHaveBeenCalledOnce()
      expect(handler2).not.toHaveBeenCalled()
    })
  })

  describe('listener execution order', () => {
    it('calls listeners in registration order', () => {
      const order: number[] = []
      bus.on('page:created', () => order.push(1))
      bus.on('page:created', () => order.push(2))
      bus.on('page:created', () => order.push(3))

      bus.emit('page:created', { pageId: 'p1', projectId: 'proj1' })

      expect(order).toEqual([1, 2, 3])
    })
  })
})

describe('eventBus singleton', () => {
  it('exports a pre-configured instance', async () => {
    const { eventBus: bus1 } = await import('./event-bus')
    const { eventBus: bus2 } = await import('./event-bus')

    expect(bus1).toBe(bus2)
  })
})
