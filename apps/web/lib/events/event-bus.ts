import type { EventName, EventBusEvents, EventPayload } from './types'

type Listener<T extends EventName> = (payload: EventPayload<T>) => void

type AnyListener = (payload: unknown) => void

interface ListenerEntry {
  listener: AnyListener
  eventName: EventName
}

export class TypedEventBus {
  private listeners = new Map<EventName, Set<AnyListener>>()
  private listenerRegistry = new Set<ListenerEntry>()

  on<T extends EventName>(eventName: T, listener: Listener<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName)!.add(listener as AnyListener)
    this.listenerRegistry.add({ listener: listener as AnyListener, eventName })

    return () => {
      this.off(eventName, listener)
    }
  }

  off<T extends EventName>(eventName: T, listener: Listener<T>): void {
    const set = this.listeners.get(eventName)
    if (set) {
      set.delete(listener as AnyListener)
      if (set.size === 0) {
        this.listeners.delete(eventName)
      }
    }
    this.listenerRegistry.delete({
      listener: listener as AnyListener,
      eventName,
    })
  }

  emit<T extends EventName>(eventName: T, payload: EventPayload<T>): void {
    const set = this.listeners.get(eventName)
    if (set) {
      for (const listener of set) {
        listener(payload)
      }
    }
  }

  listenerCount(eventName?: EventName): number {
    if (eventName) {
      return this.listeners.get(eventName)?.size ?? 0
    }
    return this.listenerRegistry.size
  }

  removeAllListeners(eventName?: EventName): void {
    if (eventName) {
      this.listeners.delete(eventName)
      for (const entry of this.listenerRegistry) {
        if (entry.eventName === eventName) {
          this.listenerRegistry.delete(entry)
        }
      }
    } else {
      this.listeners.clear()
      this.listenerRegistry.clear()
    }
  }
}

export const eventBus = new TypedEventBus()
