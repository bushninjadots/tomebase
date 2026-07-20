'use client'

import { useEffect } from 'react'
import { eventBus } from './event-bus'
import type { EventName, EventPayload } from './types'

export function useEvent<T extends EventName>(
  eventName: T,
  handler: (payload: EventPayload<T>) => void,
): void {
  useEffect(() => {
    const unsubscribe = eventBus.on(eventName, handler)
    return unsubscribe
  }, [eventName, handler])
}
