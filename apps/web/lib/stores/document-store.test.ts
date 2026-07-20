import { describe, it, expect, beforeEach } from 'vitest'
import {
  useDocumentStore,
  selectDocumentPage, selectDocumentTitle, selectDocumentContent,
  selectDocumentSavedTitle, selectDocumentSavedContent, selectDocumentIsDirty,
  selectDocumentSaveStatus, selectDocumentIsSaving, selectDocumentDraftAvailable,
  selectDocumentCursor, selectDocumentSelection, selectDocumentSnapshots,
  selectDocumentSnapshotsLoading, selectDocumentWordCount, selectDocumentCharCount,
  selectDocumentReadingTime, selectDocumentHasPage,
} from './document-store'
import type { DocumentPage, DocumentSnapshot } from './document-store'

const basePage: DocumentPage = {
  id: 'page-1',
  title: 'Test Page',
  slug: 'test-page',
  content: '# Hello\n\nSome content here.',
  description: null,
  order: 0,
  parentId: null,
}

function makeSnapshot(overrides: Partial<DocumentSnapshot> = {}): DocumentSnapshot {
  return {
    id: `snap-${Math.random().toString(36).slice(2, 6)}`,
    pageId: 'page-1',
    title: 'Snapshot Title',
    content: '# Snapshot',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('useDocumentStore', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      page: null,
      title: '',
      content: '',
      savedTitle: '',
      savedContent: '',
      saveStatus: 'saved',
      isSaving: false,
      draftAvailable: false,
      cursor: { line: 1, col: 1 },
      selection: { from: 0, to: 0 },
      snapshots: [],
      isSnapshotsLoading: false,
    })
  })

  describe('initial state', () => {
    it('has correct defaults', () => {
      const s = useDocumentStore.getState()
      expect(s.page).toBeNull()
      expect(s.title).toBe('')
      expect(s.content).toBe('')
      expect(s.savedTitle).toBe('')
      expect(s.savedContent).toBe('')
      expect(s.saveStatus).toBe('saved')
      expect(s.isSaving).toBe(false)
      expect(s.draftAvailable).toBe(false)
      expect(s.cursor).toEqual({ line: 1, col: 1 })
      expect(s.selection).toEqual({ from: 0, to: 0 })
      expect(s.snapshots).toEqual([])
      expect(s.isSnapshotsLoading).toBe(false)
    })
  })

  describe('page', () => {
    it('sets page and syncs title/content/saved', () => {
      useDocumentStore.getState().setPage(basePage)
      const s = useDocumentStore.getState()
      expect(s.page).toEqual(basePage)
      expect(s.title).toBe(basePage.title)
      expect(s.content).toBe(basePage.content)
      expect(s.savedTitle).toBe(basePage.title)
      expect(s.savedContent).toBe(basePage.content)
      expect(s.saveStatus).toBe('saved')
    })

    it('resets cursor and selection when setting page', () => {
      useDocumentStore.getState().setCursor({ line: 5, col: 10 })
      useDocumentStore.getState().setSelection({ from: 10, to: 20 })
      useDocumentStore.getState().setPage(basePage)
      const s = useDocumentStore.getState()
      expect(s.cursor).toEqual({ line: 1, col: 1 })
      expect(s.selection).toEqual({ from: 0, to: 0 })
    })

    it('clears draft available when setting page', () => {
      useDocumentStore.getState().setDraftAvailable(true)
      useDocumentStore.getState().setPage(basePage)
      expect(useDocumentStore.getState().draftAvailable).toBe(false)
    })

    it('clears page', () => {
      useDocumentStore.getState().setPage(basePage)
      useDocumentStore.getState().setPage(null)
      const s = useDocumentStore.getState()
      expect(s.page).toBeNull()
      expect(s.title).toBe('')
      expect(s.content).toBe('')
    })
  })

  describe('title and content', () => {
    it('sets title independently', () => {
      useDocumentStore.getState().setPage(basePage)
      useDocumentStore.getState().setTitle('New Title')
      expect(useDocumentStore.getState().title).toBe('New Title')
    })

    it('sets content independently', () => {
      useDocumentStore.getState().setPage(basePage)
      useDocumentStore.getState().setContent('# Updated')
      expect(useDocumentStore.getState().content).toBe('# Updated')
    })
  })

  describe('save state', () => {
    it('marks as saving', () => {
      useDocumentStore.getState().markSaving()
      expect(useDocumentStore.getState().saveStatus).toBe('saving')
    })

    it('marks as saved and updates saved versions', () => {
      useDocumentStore.getState().setPage(basePage)
      useDocumentStore.getState().setTitle('Changed')
      useDocumentStore.getState().setContent('New content')
      useDocumentStore.getState().markSaved('Changed', 'New content')
      const s = useDocumentStore.getState()
      expect(s.saveStatus).toBe('saved')
      expect(s.savedTitle).toBe('Changed')
      expect(s.savedContent).toBe('New content')
    })

    it('marks as unsaved', () => {
      useDocumentStore.getState().markUnsaved()
      expect(useDocumentStore.getState().saveStatus).toBe('unsaved')
    })
  })

  describe('dirty state', () => {
    it('is not dirty when title and content match saved', () => {
      useDocumentStore.getState().setPage(basePage)
      expect(selectDocumentIsDirty(useDocumentStore.getState())).toBe(false)
    })

    it('is dirty when title differs', () => {
      useDocumentStore.getState().setPage(basePage)
      useDocumentStore.getState().setTitle('Different')
      expect(selectDocumentIsDirty(useDocumentStore.getState())).toBe(true)
    })

    it('is dirty when content differs', () => {
      useDocumentStore.getState().setPage(basePage)
      useDocumentStore.getState().setContent('Different content')
      expect(selectDocumentIsDirty(useDocumentStore.getState())).toBe(true)
    })

    it('is not dirty after markSaved with same values', () => {
      useDocumentStore.getState().setPage(basePage)
      useDocumentStore.getState().setTitle('Changed')
      useDocumentStore.getState().markSaved('Changed', basePage.content)
      expect(selectDocumentIsDirty(useDocumentStore.getState())).toBe(false)
    })
  })

  describe('draft', () => {
    it('sets draft available', () => {
      useDocumentStore.getState().setDraftAvailable(true)
      expect(useDocumentStore.getState().draftAvailable).toBe(true)
    })

    it('clears draft available', () => {
      useDocumentStore.getState().setDraftAvailable(true)
      useDocumentStore.getState().setDraftAvailable(false)
      expect(useDocumentStore.getState().draftAvailable).toBe(false)
    })
  })

  describe('cursor', () => {
    it('sets cursor position', () => {
      useDocumentStore.getState().setCursor({ line: 10, col: 5 })
      expect(useDocumentStore.getState().cursor).toEqual({ line: 10, col: 5 })
    })
  })

  describe('selection', () => {
    it('sets selection range', () => {
      useDocumentStore.getState().setSelection({ from: 10, to: 25 })
      expect(useDocumentStore.getState().selection).toEqual({ from: 10, to: 25 })
    })
  })

  describe('snapshots', () => {
    it('sets snapshots', () => {
      const snaps = [makeSnapshot(), makeSnapshot()]
      useDocumentStore.getState().setSnapshots(snaps)
      expect(useDocumentStore.getState().snapshots).toHaveLength(2)
      expect(useDocumentStore.getState().isSnapshotsLoading).toBe(false)
    })

    it('sets snapshots loading', () => {
      useDocumentStore.getState().setSnapshotsLoading(true)
      expect(useDocumentStore.getState().isSnapshotsLoading).toBe(true)
    })

    it('clears loading when setting snapshots', () => {
      useDocumentStore.getState().setSnapshotsLoading(true)
      useDocumentStore.getState().setSnapshots([makeSnapshot()])
      expect(useDocumentStore.getState().isSnapshotsLoading).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets all state to initial', () => {
      useDocumentStore.getState().setPage(basePage)
      useDocumentStore.getState().setTitle('Changed')
      useDocumentStore.getState().setContent('New content')
      useDocumentStore.getState().markSaving()
      useDocumentStore.getState().setCursor({ line: 5, col: 3 })
      useDocumentStore.getState().setSelection({ from: 10, to: 20 })
      useDocumentStore.getState().setSnapshots([makeSnapshot()])
      useDocumentStore.getState().setDraftAvailable(true)

      useDocumentStore.getState().reset()

      const s = useDocumentStore.getState()
      expect(s.page).toBeNull()
      expect(s.title).toBe('')
      expect(s.content).toBe('')
      expect(s.savedTitle).toBe('')
      expect(s.savedContent).toBe('')
      expect(s.saveStatus).toBe('saved')
      expect(s.isSaving).toBe(false)
      expect(s.draftAvailable).toBe(false)
      expect(s.cursor).toEqual({ line: 1, col: 1 })
      expect(s.selection).toEqual({ from: 0, to: 0 })
      expect(s.snapshots).toEqual([])
      expect(s.isSnapshotsLoading).toBe(false)
    })
  })
})

describe('selectors', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      page: basePage,
      title: 'Current Title',
      content: 'Current content',
      savedTitle: 'Saved Title',
      savedContent: 'Saved content',
      saveStatus: 'unsaved',
      isSaving: false,
      draftAvailable: true,
      cursor: { line: 5, col: 12 },
      selection: { from: 10, to: 25 },
      snapshots: [makeSnapshot({ id: 's1' }), makeSnapshot({ id: 's2' })],
      isSnapshotsLoading: false,
    })
  })

  it('selectDocumentPage returns page', () => {
    expect(selectDocumentPage(useDocumentStore.getState())).toEqual(basePage)
  })

  it('selectDocumentTitle returns title', () => {
    expect(selectDocumentTitle(useDocumentStore.getState())).toBe('Current Title')
  })

  it('selectDocumentContent returns content', () => {
    expect(selectDocumentContent(useDocumentStore.getState())).toBe('Current content')
  })

  it('selectDocumentSavedTitle returns saved title', () => {
    expect(selectDocumentSavedTitle(useDocumentStore.getState())).toBe('Saved Title')
  })

  it('selectDocumentSavedContent returns saved content', () => {
    expect(selectDocumentSavedContent(useDocumentStore.getState())).toBe('Saved content')
  })

  it('selectDocumentIsDirty returns true when differs', () => {
    expect(selectDocumentIsDirty(useDocumentStore.getState())).toBe(true)
  })

  it('selectDocumentIsDirty returns false when same', () => {
    useDocumentStore.setState({ title: 'Saved Title', content: 'Saved content' })
    expect(selectDocumentIsDirty(useDocumentStore.getState())).toBe(false)
  })

  it('selectDocumentSaveStatus returns status', () => {
    expect(selectDocumentSaveStatus(useDocumentStore.getState())).toBe('unsaved')
  })

  it('selectDocumentIsSaving returns false', () => {
    expect(selectDocumentIsSaving(useDocumentStore.getState())).toBe(false)
  })

  it('selectDocumentDraftAvailable returns true', () => {
    expect(selectDocumentDraftAvailable(useDocumentStore.getState())).toBe(true)
  })

  it('selectDocumentCursor returns cursor', () => {
    expect(selectDocumentCursor(useDocumentStore.getState())).toEqual({ line: 5, col: 12 })
  })

  it('selectDocumentSelection returns selection', () => {
    expect(selectDocumentSelection(useDocumentStore.getState())).toEqual({ from: 10, to: 25 })
  })

  it('selectDocumentSnapshots returns snapshots', () => {
    expect(selectDocumentSnapshots(useDocumentStore.getState())).toHaveLength(2)
  })

  it('selectDocumentSnapshotsLoading returns false', () => {
    expect(selectDocumentSnapshotsLoading(useDocumentStore.getState())).toBe(false)
  })

  it('selectDocumentWordCount returns word count', () => {
    expect(selectDocumentWordCount(useDocumentStore.getState())).toBe(2)
  })

  it('selectDocumentWordCount returns 0 for empty content', () => {
    useDocumentStore.setState({ content: '' })
    expect(selectDocumentWordCount(useDocumentStore.getState())).toBe(0)
  })

  it('selectDocumentCharCount returns char count', () => {
    expect(selectDocumentCharCount(useDocumentStore.getState())).toBe(15)
  })

  it('selectDocumentReadingTime returns minutes', () => {
    expect(selectDocumentReadingTime(useDocumentStore.getState())).toBe(1)
  })

  it('selectDocumentReadingTime returns at least 1', () => {
    useDocumentStore.setState({ content: '' })
    expect(selectDocumentReadingTime(useDocumentStore.getState())).toBe(1)
  })

  it('selectDocumentHasPage returns true', () => {
    expect(selectDocumentHasPage(useDocumentStore.getState())).toBe(true)
  })

  it('selectDocumentHasPage returns false when no page', () => {
    useDocumentStore.setState({ page: null })
    expect(selectDocumentHasPage(useDocumentStore.getState())).toBe(false)
  })
})
