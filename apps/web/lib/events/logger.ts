import { eventBus } from './event-bus'
import type { EventName, EventBusEvents } from './types'

const COLORS: Record<string, string> = {
  page: '#3b82f6',
  document: '#8b5cf6',
  project: '#10b981',
  health: '#f59e0b',
  diagnostic: '#ef4444',
  import: '#06b6d4',
  sync: '#ec4899',
  ai: '#6366f1',
}

function getEventColor(eventName: EventName): string {
  const prefix = eventName.split(':')[0] as string
  return COLORS[prefix] ?? '#6b7280'
}

function formatTimestamp(): string {
  return new Date().toISOString().split('T')[1]!.slice(0, 12)
}

export function enableEventLogger(): () => void {
  const cleanups: Array<() => void> = []

  const handler = <T extends EventName>(eventName: T) => {
    return (payload: EventBusEvents[T]) => {
      const color = getEventColor(eventName)
      const time = formatTimestamp()

      console.groupCollapsed(
        `%c[EventBus]%c ${time} %c${eventName}`,
        'color: #6b7280; font-weight: bold',
        'color: #9ca3af',
        `color: ${color}; font-weight: bold`,
      )
      console.log('%cPayload:', 'color: #9ca3af', payload)
      console.log(
        '%cStack trace:',
        'color: #9ca3af',
        new Error().stack?.split('\n').slice(2, 6).join('\n'),
      )
      console.groupEnd()
    }
  }

  const eventNames: EventName[] = [
    'page:created',
    'page:updated',
    'page:deleted',
    'page:moved',
    'page:published',
    'page:unpublished',
    'document:loaded',
    'document:saved',
    'document:restored',
    'document:dirty',
    'document:clean',
    'project:loaded',
    'project:published',
    'project:unpublished',
    'project:deleted',
    'health:scanned',
    'health:scoreChanged',
    'diagnostic:fixed',
    'diagnostic:ignored',
    'import:started',
    'import:completed',
    'import:failed',
    'sync:started',
    'sync:completed',
    'sync:failed',
    'ai:response',
    'ai:error',
    'ai:streamingStarted',
    'ai:streamingChunk',
    'ai:streamingDone',
  ]

  for (const name of eventNames) {
    cleanups.push(eventBus.on(name, handler(name) as (payload: unknown) => void))
  }

  console.log(
    '%c[EventBus] Logger enabled — listening to all events',
    'color: #6b7280; font-style: italic',
  )

  return () => {
    for (const cleanup of cleanups) {
      cleanup()
    }
    console.log(
      '%c[EventBus] Logger disabled',
      'color: #6b7280; font-style: italic',
    )
  }
}
