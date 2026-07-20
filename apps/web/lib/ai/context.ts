import type { AIContextContribution, AIContextProvider } from './types'

const providers = new Map<string, AIContextProvider>()
let enabled = true

export function registerContextProvider(key: string, provider: AIContextProvider): () => void {
  providers.set(key, provider)
  return () => { providers.delete(key) }
}

export function unregisterContextProvider(key: string): void {
  providers.delete(key)
}

export function setContextEnabled(value: boolean): void {
  enabled = value
}

export function isContextEnabled(): boolean {
  return enabled
}

export async function collectContext(): Promise<AIContextContribution[]> {
  if (!enabled) return []

  const results = await Promise.allSettled(
    Array.from(providers.entries()).map(async ([key, provider]) => {
      try {
        return await provider()
      } catch {
        return null
      }
    }),
  )

  return results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((c): c is AIContextContribution => c !== null)
    .sort((a, b) => a.priority - b.priority)
}

export function contributionsToString(contributions: AIContextContribution[]): string {
  if (contributions.length === 0) return ''

  const parts: string[] = ['--- DOCUMENTATION CONTEXT ---']

  for (const c of contributions) {
    parts.push(`\n[${c.label}]`)
    parts.push(c.content)
  }

  parts.push('--- END CONTEXT ---')
  return parts.join('\n')
}

export function clearAllProviders(): void {
  providers.clear()
}
