'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/stores/app-store'
import { useTheme as useExistingTheme } from '@/components/theme-provider'
import { useToast as useExistingToast } from '@/components/toast'

export function AppStoreSync({ children }: { children: React.ReactNode }) {
  return (
    <ThemeSync>
      <ToastSync>
        {children}
      </ToastSync>
    </ThemeSync>
  )
}

function ThemeSync({ children }: { children: React.ReactNode }) {
  const { theme } = useExistingTheme()
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    setTheme(theme)
  }, [theme, setTheme])

  return <>{children}</>
}

function ToastSync({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, dismissToast } = useExistingToast()
  const storeToasts = useAppStore((s) => s.toasts)
  const storeAddToast = useAppStore((s) => s.addToast)
  const storeRemoveToast = useAppStore((s) => s.removeToast)
  const syncedIds = useRef(new Set<string>())

  useEffect(() => {
    for (const toast of toasts) {
      if (!syncedIds.current.has(toast.id)) {
        syncedIds.current.add(toast.id)
        storeAddToast(toast.type, toast.message)
      }
    }
    for (const id of syncedIds.current) {
      if (!toasts.find((t) => t.id === id)) {
        syncedIds.current.delete(id)
        storeRemoveToast(id)
      }
    }
  }, [toasts, storeAddToast, storeRemoveToast])

  useEffect(() => {
    const ids = syncedIds.current
    return () => {
      ids.clear()
    }
  }, [])

  return <>{children}</>
}
