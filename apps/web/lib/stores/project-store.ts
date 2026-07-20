import { create } from 'zustand'
import type { Diagnostic, HealthScore } from '@fluid/types'

export interface StoreProject {
  id: string
  name: string
  slug: string
  description: string | null
  userId: string
  published: boolean
  customDomain: string | null
  domainStatus: string | null
  domainVerifiedAt: Date | null
  domainLastCheckedAt: Date | null
  domainSslStatus: string | null
  logoUrl: string | null
  teamId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface StorePage {
  id: string
  title: string
  slug: string
  content: string
  description: string | null
  projectId: string
  parentId: string | null
  order: number
  published: boolean
  viewCount: number
  lastViewedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface StoreHealth {
  score: number
  totalPages: number
  diagnostics: Diagnostic[]
  healthScore: HealthScore
  scannedAt: string
  previousScore: number | null
  previousScanAt: string | null
}

export interface StoreTeamMember {
  id: string
  role: string
  userId: string
  teamId: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

export interface StorePageTreeNode {
  id: string
  title: string
  slug: string
  order: number
  parentId: string | null
  children: StorePageTreeNode[]
  depth: number
}

interface ProjectState {
  project: StoreProject | null
  pages: StorePage[]
  health: StoreHealth | null
  diagnostics: Diagnostic[]
  teamMembers: StoreTeamMember[]
  isLoading: boolean
  isHealthLoading: boolean
  isTeamLoading: boolean
  error: string | null
  healthError: string | null
  lastFetchedAt: number | null

  setProject: (project: StoreProject | null) => void
  setPages: (pages: StorePage[]) => void
  addPage: (page: StorePage) => void
  updatePage: (id: string, changes: Partial<Pick<StorePage, 'title' | 'content' | 'published' | 'parentId' | 'order'>>) => void
  removePage: (id: string) => void
  movePage: (id: string, newParentId: string | null, newOrder: number) => void
  setHealth: (health: StoreHealth | null) => void
  setDiagnostics: (diagnostics: Diagnostic[]) => void
  setTeamMembers: (members: StoreTeamMember[]) => void
  setLoading: (loading: boolean) => void
  setHealthLoading: (loading: boolean) => void
  setTeamLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHealthError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  project: null,
  pages: [],
  health: null,
  diagnostics: [],
  teamMembers: [],
  isLoading: false,
  isHealthLoading: false,
  isTeamLoading: false,
  error: null,
  healthError: null,
  lastFetchedAt: null,
}

export const useProjectStore = create<ProjectState>()((set) => ({
  ...initialState,

  setProject: (project) =>
    set({ project, lastFetchedAt: Date.now() }),

  setPages: (pages) =>
    set({ pages }),

  addPage: (page) =>
    set((state) => ({
      pages: [...state.pages, page].sort((a, b) => a.order - b.order),
    })),

  updatePage: (id, changes) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === id ? { ...p, ...changes } : p,
      ),
    })),

  removePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
    })),

  movePage: (id, newParentId, newOrder) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === id
          ? { ...p, parentId: newParentId, order: newOrder }
          : p,
      ).sort((a, b) => a.order - b.order),
    })),

  setHealth: (health) =>
    set({ health, isHealthLoading: false, healthError: null }),

  setDiagnostics: (diagnostics) =>
    set({ diagnostics }),

  setTeamMembers: (members) =>
    set({ teamMembers: members, isTeamLoading: false }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setHealthLoading: (isHealthLoading) =>
    set({ isHealthLoading }),

  setTeamLoading: (isTeamLoading) =>
    set({ isTeamLoading }),

  setError: (error) =>
    set({ error, isLoading: false }),

  setHealthError: (healthError) =>
    set({ healthError, isHealthLoading: false }),

  reset: () =>
    set(initialState),
}))

// ─── Derived Selectors ──────────────────────────────────────────

export function selectProject(state: ProjectState) {
  return state.project
}

export function selectPages(state: ProjectState) {
  return state.pages
}

export function selectPageCount(state: ProjectState) {
  return state.pages.length
}

export function selectPublishedPageCount(state: ProjectState) {
  return state.pages.filter((p) => p.published).length
}

export function selectTotalViews(state: ProjectState) {
  return state.pages.reduce((sum, p) => sum + p.viewCount, 0)
}

export function selectHealth(state: ProjectState) {
  return state.health
}

export function selectHealthScore(state: ProjectState) {
  return state.health?.healthScore ?? null
}

export function selectDiagnostics(state: ProjectState) {
  return state.diagnostics
}

export function selectTeamMembers(state: ProjectState) {
  return state.teamMembers
}

export function selectIsLoading(state: ProjectState) {
  return state.isLoading
}

export function selectIsHealthLoading(state: ProjectState) {
  return state.isHealthLoading
}

export function selectIsTeamLoading(state: ProjectState) {
  return state.isTeamLoading
}

export function selectError(state: ProjectState) {
  return state.error
}

export function selectHealthError(state: ProjectState) {
  return state.healthError
}

export function selectPage(state: ProjectState, pageId: string) {
  return state.pages.find((p) => p.id === pageId) ?? null
}

export function selectPageBySlug(state: ProjectState, slug: string) {
  return state.pages.find((p) => p.slug === slug) ?? null
}

export function selectPageTree(state: ProjectState): StorePageTreeNode[] {
  const map = new Map<string, StorePageTreeNode>()
  const roots: StorePageTreeNode[] = []

  for (const p of state.pages) {
    map.set(p.id, {
      id: p.id,
      title: p.title,
      slug: p.slug,
      order: p.order,
      parentId: p.parentId,
      children: [],
      depth: 0,
    })
  }

  for (const p of state.pages) {
    const node = map.get(p.id)!
    if (p.parentId && map.has(p.parentId)) {
      const parent = map.get(p.parentId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (nodes: StorePageTreeNode[]) => {
    nodes.sort((a, b) => {
      const pageA = state.pages.find((p) => p.id === a.id)
      const pageB = state.pages.find((p) => p.id === b.id)
      return (pageA?.order ?? 0) - (pageB?.order ?? 0)
    })
    for (const node of nodes) {
      sortNodes(node.children)
    }
  }
  sortNodes(roots)

  return roots
}

export function selectPagesForProject(state: ProjectState, projectId: string) {
  return state.pages.filter((p) => p.projectId === projectId)
}

export function selectPublishedPages(state: ProjectState) {
  return state.pages.filter((p) => p.published)
}

export function selectStaleData(state: ProjectState) {
  if (!state.lastFetchedAt) return true
  return Date.now() - state.lastFetchedAt > 30_000
}
