import { describe, it, expect, beforeEach } from 'vitest'
import {
  useProjectStore,
  selectProject, selectPages, selectPageCount, selectPublishedPageCount,
  selectTotalViews, selectHealth, selectHealthScore, selectDiagnostics,
  selectTeamMembers, selectIsLoading, selectIsHealthLoading, selectIsTeamLoading,
  selectError, selectHealthError, selectPage, selectPageBySlug,
  selectPublishedPages, selectStaleData, selectPageTree,
} from './project-store'
import type { StoreProject, StorePage, StoreHealth, StoreTeamMember } from './project-store'
import type { Diagnostic, HealthScore } from '@fluid/types'

const baseProject: StoreProject = {
  id: 'proj-1',
  name: 'Test Project',
  slug: 'test-project',
  description: 'A test project',
  userId: 'user-1',
  published: false,
  customDomain: null,
  domainStatus: null,
  domainVerifiedAt: null,
  domainLastCheckedAt: null,
  domainSslStatus: null,
  logoUrl: null,
  teamId: 'team-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
}

function makePage(overrides: Partial<StorePage> = {}): StorePage {
  return {
    id: `page-${Math.random().toString(36).slice(2, 6)}`,
    title: 'Test Page',
    slug: 'test-page',
    content: '# Test',
    description: null,
    projectId: 'proj-1',
    parentId: null,
    order: 0,
    published: true,
    viewCount: 0,
    lastViewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

const baseHealthScore: HealthScore = {
  score: 85,
  grade: 'B',
  label: 'Very Good',
  color: 'green',
  errorCount: 1,
  warningCount: 3,
  infoCount: 5,
  totalIssues: 9,
  fixableCount: 4,
  categoryBreakdown: [],
}

function makeDiagnostic(overrides: Partial<Diagnostic> = {}): Diagnostic {
  return {
    id: `diag-${Math.random().toString(36).slice(2, 6)}`,
    category: 'broken_link',
    severity: 'error',
    title: 'Broken link',
    description: 'Link is broken',
    explanation: 'Fix the link',
    pageId: 'page-1',
    pageSlug: 'test-page',
    pageTitle: 'Test Page',
    line: 10,
    column: 1,
    rule: 'broken_link',
    canAutoFix: false,
    fixPreview: null,
    aiAvailable: false,
    ignored: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
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
    })
  })

  describe('initial state', () => {
    it('has correct defaults', () => {
      const s = useProjectStore.getState()
      expect(s.project).toBeNull()
      expect(s.pages).toEqual([])
      expect(s.health).toBeNull()
      expect(s.diagnostics).toEqual([])
      expect(s.teamMembers).toEqual([])
      expect(s.isLoading).toBe(false)
      expect(s.isHealthLoading).toBe(false)
      expect(s.isTeamLoading).toBe(false)
      expect(s.error).toBeNull()
      expect(s.healthError).toBeNull()
      expect(s.lastFetchedAt).toBeNull()
    })
  })

  describe('project', () => {
    it('sets project and records timestamp', () => {
      const before = Date.now()
      useProjectStore.getState().setProject(baseProject)
      const s = useProjectStore.getState()
      expect(s.project).toEqual(baseProject)
      expect(s.lastFetchedAt).toBeGreaterThanOrEqual(before)
    })

    it('clears project', () => {
      useProjectStore.getState().setProject(baseProject)
      useProjectStore.getState().setProject(null)
      expect(useProjectStore.getState().project).toBeNull()
    })
  })

  describe('pages', () => {
    it('sets pages', () => {
      const pages = [makePage({ order: 1 }), makePage({ order: 0 })]
      useProjectStore.getState().setPages(pages)
      expect(useProjectStore.getState().pages).toHaveLength(2)
    })

    it('adds a page', () => {
      const p1 = makePage({ id: 'p1', order: 1 })
      const p2 = makePage({ id: 'p2', order: 0 })
      useProjectStore.getState().setPages([p1])
      useProjectStore.getState().addPage(p2)
      const pages = useProjectStore.getState().pages
      expect(pages).toHaveLength(2)
      expect(pages[0]!.id).toBe('p2')
      expect(pages[1]!.id).toBe('p1')
    })

    it('updates a page by id', () => {
      const p1 = makePage({ id: 'p1', title: 'Original' })
      useProjectStore.getState().setPages([p1])
      useProjectStore.getState().updatePage('p1', { title: 'Updated' })
      expect(useProjectStore.getState().pages[0]!.title).toBe('Updated')
    })

    it('does not update non-existent page', () => {
      const p1 = makePage({ id: 'p1', title: 'Original' })
      useProjectStore.getState().setPages([p1])
      useProjectStore.getState().updatePage('nonexistent', { title: 'Updated' })
      expect(useProjectStore.getState().pages[0]!.title).toBe('Original')
    })

    it('updates multiple fields', () => {
      const p1 = makePage({ id: 'p1', title: 'Old', content: 'old content', published: false })
      useProjectStore.getState().setPages([p1])
      useProjectStore.getState().updatePage('p1', { title: 'New', published: true })
      const page = useProjectStore.getState().pages[0]!
      expect(page.title).toBe('New')
      expect(page.published).toBe(true)
      expect(page.content).toBe('old content')
    })

    it('removes a page by id', () => {
      const p1 = makePage({ id: 'p1' })
      const p2 = makePage({ id: 'p2' })
      useProjectStore.getState().setPages([p1, p2])
      useProjectStore.getState().removePage('p1')
      const pages = useProjectStore.getState().pages
      expect(pages).toHaveLength(1)
      expect(pages[0]!.id).toBe('p2')
    })

    it('moves a page', () => {
      const p1 = makePage({ id: 'p1', order: 0, parentId: null })
      const p2 = makePage({ id: 'p2', order: 1, parentId: null })
      useProjectStore.getState().setPages([p1, p2])
      useProjectStore.getState().movePage('p1', 'p2', 2)
      const pages = useProjectStore.getState().pages
      const moved = pages.find((p) => p.id === 'p1')!
      expect(moved.parentId).toBe('p2')
      expect(moved.order).toBe(2)
    })
  })

  describe('health', () => {
    it('sets health', () => {
      const health: StoreHealth = {
        score: 85,
        totalPages: 10,
        diagnostics: [],
        healthScore: baseHealthScore,
        scannedAt: new Date().toISOString(),
        previousScore: 80,
        previousScanAt: null,
      }
      useProjectStore.getState().setHealth(health)
      const s = useProjectStore.getState()
      expect(s.health).toEqual(health)
      expect(s.isHealthLoading).toBe(false)
      expect(s.healthError).toBeNull()
    })

    it('clears health', () => {
      useProjectStore.getState().setHealth({
        score: 85, totalPages: 10, diagnostics: [], healthScore: baseHealthScore,
        scannedAt: new Date().toISOString(), previousScore: null, previousScanAt: null,
      })
      useProjectStore.getState().setHealth(null)
      expect(useProjectStore.getState().health).toBeNull()
    })
  })

  describe('diagnostics', () => {
    it('sets diagnostics', () => {
      const diags = [makeDiagnostic(), makeDiagnostic()]
      useProjectStore.getState().setDiagnostics(diags)
      expect(useProjectStore.getState().diagnostics).toHaveLength(2)
    })

    it('clears diagnostics', () => {
      useProjectStore.getState().setDiagnostics([makeDiagnostic()])
      useProjectStore.getState().setDiagnostics([])
      expect(useProjectStore.getState().diagnostics).toHaveLength(0)
    })
  })

  describe('team members', () => {
    it('sets team members and clears loading', () => {
      const members: StoreTeamMember[] = [{
        id: 'tm-1', role: 'admin', userId: 'user-1', teamId: 'team-1',
        user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', image: null },
      }]
      useProjectStore.getState().setTeamLoading(true)
      useProjectStore.getState().setTeamMembers(members)
      const s = useProjectStore.getState()
      expect(s.teamMembers).toHaveLength(1)
      expect(s.isTeamLoading).toBe(false)
    })
  })

  describe('loading and error states', () => {
    it('sets and clears loading', () => {
      useProjectStore.getState().setLoading(true)
      expect(useProjectStore.getState().isLoading).toBe(true)
      useProjectStore.getState().setLoading(false)
      expect(useProjectStore.getState().isLoading).toBe(false)
    })

    it('sets and clears health loading', () => {
      useProjectStore.getState().setHealthLoading(true)
      expect(useProjectStore.getState().isHealthLoading).toBe(true)
      useProjectStore.getState().setHealthLoading(false)
      expect(useProjectStore.getState().isHealthLoading).toBe(false)
    })

    it('sets and clears team loading', () => {
      useProjectStore.getState().setTeamLoading(true)
      expect(useProjectStore.getState().isTeamLoading).toBe(true)
      useProjectStore.getState().setTeamLoading(false)
      expect(useProjectStore.getState().isTeamLoading).toBe(false)
    })

    it('sets error and clears loading', () => {
      useProjectStore.getState().setLoading(true)
      useProjectStore.getState().setError('Failed to load')
      const s = useProjectStore.getState()
      expect(s.error).toBe('Failed to load')
      expect(s.isLoading).toBe(false)
    })

    it('sets health error and clears health loading', () => {
      useProjectStore.getState().setHealthLoading(true)
      useProjectStore.getState().setHealthError('Scan failed')
      const s = useProjectStore.getState()
      expect(s.healthError).toBe('Scan failed')
      expect(s.isHealthLoading).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets all state to initial', () => {
      useProjectStore.getState().setProject(baseProject)
      useProjectStore.getState().setPages([makePage()])
      useProjectStore.getState().setHealth({
        score: 85, totalPages: 10, diagnostics: [], healthScore: baseHealthScore,
        scannedAt: new Date().toISOString(), previousScore: null, previousScanAt: null,
      })
      useProjectStore.getState().setDiagnostics([makeDiagnostic()])
      useProjectStore.getState().setTeamMembers([{
        id: 'tm-1', role: 'admin', userId: 'user-1', teamId: 'team-1',
        user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', image: null },
      }])
      useProjectStore.getState().setLoading(true)
      useProjectStore.getState().setError('some error')

      useProjectStore.getState().reset()

      const s = useProjectStore.getState()
      expect(s.project).toBeNull()
      expect(s.pages).toEqual([])
      expect(s.health).toBeNull()
      expect(s.diagnostics).toEqual([])
      expect(s.teamMembers).toEqual([])
      expect(s.isLoading).toBe(false)
      expect(s.isHealthLoading).toBe(false)
      expect(s.isTeamLoading).toBe(false)
      expect(s.error).toBeNull()
      expect(s.healthError).toBeNull()
      expect(s.lastFetchedAt).toBeNull()
    })
  })
})

describe('selectors', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: baseProject,
      pages: [
        makePage({ id: 'p1', title: 'Page A', slug: 'page-a', order: 0, published: true, viewCount: 10, parentId: null }),
        makePage({ id: 'p2', title: 'Page B', slug: 'page-b', order: 1, published: false, viewCount: 5, parentId: 'p1' }),
        makePage({ id: 'p3', title: 'Page C', slug: 'page-c', order: 2, published: true, viewCount: 20, parentId: null }),
      ],
      health: {
        score: 85, totalPages: 3, diagnostics: [makeDiagnostic()],
        healthScore: baseHealthScore, scannedAt: new Date().toISOString(),
        previousScore: 80, previousScanAt: null,
      },
      diagnostics: [makeDiagnostic({ id: 'd1' }), makeDiagnostic({ id: 'd2' })],
      teamMembers: [{
        id: 'tm-1', role: 'admin', userId: 'user-1', teamId: 'team-1',
        user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', image: null },
      }],
      isLoading: false,
      isHealthLoading: false,
      isTeamLoading: false,
      error: null,
      healthError: null,
      lastFetchedAt: Date.now(),
    })
  })

  it('selectProject returns project', () => {
    expect(selectProject(useProjectStore.getState())).toEqual(baseProject)
  })

  it('selectPages returns pages', () => {
    expect(selectPages(useProjectStore.getState())).toHaveLength(3)
  })

  it('selectPageCount returns count', () => {
    expect(selectPageCount(useProjectStore.getState())).toBe(3)
  })

  it('selectPublishedPageCount returns published count', () => {
    expect(selectPublishedPageCount(useProjectStore.getState())).toBe(2)
  })

  it('selectTotalViews returns sum', () => {
    expect(selectTotalViews(useProjectStore.getState())).toBe(35)
  })

  it('selectHealth returns health', () => {
    expect(selectHealth(useProjectStore.getState())?.score).toBe(85)
  })

  it('selectHealthScore returns HealthScore', () => {
    expect(selectHealthScore(useProjectStore.getState())?.grade).toBe('B')
  })

  it('selectDiagnostics returns diagnostics', () => {
    expect(selectDiagnostics(useProjectStore.getState())).toHaveLength(2)
  })

  it('selectTeamMembers returns members', () => {
    expect(selectTeamMembers(useProjectStore.getState())).toHaveLength(1)
  })

  it('selectIsLoading returns loading state', () => {
    expect(selectIsLoading(useProjectStore.getState())).toBe(false)
  })

  it('selectIsHealthLoading returns health loading', () => {
    expect(selectIsHealthLoading(useProjectStore.getState())).toBe(false)
  })

  it('selectIsTeamLoading returns team loading', () => {
    expect(selectIsTeamLoading(useProjectStore.getState())).toBe(false)
  })

  it('selectError returns error', () => {
    expect(selectError(useProjectStore.getState())).toBeNull()
  })

  it('selectHealthError returns health error', () => {
    expect(selectHealthError(useProjectStore.getState())).toBeNull()
  })

  it('selectPage finds page by id', () => {
    expect(selectPage(useProjectStore.getState(), 'p1')?.title).toBe('Page A')
  })

  it('selectPage returns null for missing id', () => {
    expect(selectPage(useProjectStore.getState(), 'nonexistent')).toBeNull()
  })

  it('selectPageBySlug finds page by slug', () => {
    expect(selectPageBySlug(useProjectStore.getState(), 'page-b')?.id).toBe('p2')
  })

  it('selectPageBySlug returns null for missing slug', () => {
    expect(selectPageBySlug(useProjectStore.getState(), 'nonexistent')).toBeNull()
  })

  it('selectPublishedPages returns only published', () => {
    const published = selectPublishedPages(useProjectStore.getState())
    expect(published).toHaveLength(2)
    expect(published.every((p: StorePage) => p.published)).toBe(true)
  })

  it('selectStaleData returns false when recently fetched', () => {
    expect(selectStaleData(useProjectStore.getState())).toBe(false)
  })

  it('selectStaleData returns true when old', () => {
    useProjectStore.setState({ lastFetchedAt: Date.now() - 60_000 })
    expect(selectStaleData(useProjectStore.getState())).toBe(true)
  })

  it('selectStaleData returns true when never fetched', () => {
    useProjectStore.setState({ lastFetchedAt: null })
    expect(selectStaleData(useProjectStore.getState())).toBe(true)
  })
})

describe('selectPageTree', () => {
  it('builds a flat tree', () => {
    useProjectStore.setState({
      pages: [
        makePage({ id: 'p1', order: 0, parentId: null }),
        makePage({ id: 'p2', order: 1, parentId: null }),
      ],
    })
    const tree = selectPageTree(useProjectStore.getState())
    expect(tree).toHaveLength(2)
    expect(tree[0]!.children).toHaveLength(0)
    expect(tree[1]!.children).toHaveLength(0)
  })

  it('builds a nested tree', () => {
    useProjectStore.setState({
      pages: [
        makePage({ id: 'p1', order: 0, parentId: null }),
        makePage({ id: 'p2', order: 0, parentId: 'p1' }),
        makePage({ id: 'p3', order: 1, parentId: 'p1' }),
        makePage({ id: 'p4', order: 0, parentId: null }),
      ],
    })
    const tree = selectPageTree(useProjectStore.getState())
    expect(tree).toHaveLength(2)
    expect(tree[0]!.id).toBe('p1')
    expect(tree[0]!.children).toHaveLength(2)
    expect(tree[0]!.children[0]!.id).toBe('p2')
    expect(tree[0]!.children[1]!.id).toBe('p3')
    expect(tree[1]!.id).toBe('p4')
  })

  it('sets depth correctly', () => {
    useProjectStore.setState({
      pages: [
        makePage({ id: 'p1', order: 0, parentId: null }),
        makePage({ id: 'p2', order: 0, parentId: 'p1' }),
        makePage({ id: 'p3', order: 0, parentId: 'p2' }),
      ],
    })
    const tree = selectPageTree(useProjectStore.getState())
    expect(tree[0]!.depth).toBe(0)
    expect(tree[0]!.children[0]!.depth).toBe(1)
    expect(tree[0]!.children[0]!.children[0]!.depth).toBe(2)
  })

  it('returns empty array when no pages', () => {
    useProjectStore.setState({ pages: [] })
    expect(selectPageTree(useProjectStore.getState())).toEqual([])
  })
})
