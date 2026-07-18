// @fluid/ai — Shared AI types and utilities for TomeBase
// This package provides AI-related types and context building utilities
// used across the monorepo. Provider implementations live in apps/web/lib/ai-provider/.

export interface AIContextEntry {
  key: string;
  value: string;
  priority: number;
}

export function buildContextString(entries: AIContextEntry[]): string {
  return entries
    .sort((a, b) => b.priority - a.priority)
    .map((e) => `${e.key}: ${e.value}`)
    .join('\n');
}

export interface RepositoryIndexEntry {
  symbolName: string;
  symbolType: string;
  kind: string;
  content: string;
  language: string | null;
  filePath: string | null;
  metadata: Record<string, unknown>;
  relationships: Array<{ targetSymbol: string; targetKind: string; type: string }>;
}

export const MAX_CONTEXT_ENTRIES = 50;
export const MAX_SELECTED_TEXT_LENGTH = 4000;
