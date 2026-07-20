import { create } from 'zustand'

export interface DocumentPage {
  id: string
  title: string
  slug: string
  content: string
  description: string | null
  order: number
  parentId: string | null
}

export interface DocumentSnapshot {
  id: string
  pageId: string
  title: string
  content: string
  createdAt: string
}

export interface DocumentCursor {
  line: number
  col: number
}

export interface DocumentSelection {
  from: number
  to: number
}

export type SaveStatus = 'saved' | 'unsaved' | 'saving'

interface DocumentState {
  page: DocumentPage | null
  title: string
  content: string
  savedTitle: string
  savedContent: string
  saveStatus: SaveStatus
  isSaving: boolean
  draftAvailable: boolean
  cursor: DocumentCursor
  selection: DocumentSelection
  snapshots: DocumentSnapshot[]
  isSnapshotsLoading: boolean

  setPage: (page: DocumentPage | null) => void
  setTitle: (title: string) => void
  setContent: (content: string) => void
  markSaved: (title: string, content: string) => void
  markSaving: () => void
  markUnsaved: () => void
  setDraftAvailable: (available: boolean) => void
  setCursor: (cursor: DocumentCursor) => void
  setSelection: (selection: DocumentSelection) => void
  setSnapshots: (snapshots: DocumentSnapshot[]) => void
  setSnapshotsLoading: (loading: boolean) => void
  reset: () => void
}

const initialState = {
  page: null,
  title: '',
  content: '',
  savedTitle: '',
  savedContent: '',
  saveStatus: 'saved' as SaveStatus,
  isSaving: false,
  draftAvailable: false,
  cursor: { line: 1, col: 1 },
  selection: { from: 0, to: 0 },
  snapshots: [] as DocumentSnapshot[],
  isSnapshotsLoading: false,
}

export const useDocumentStore = create<DocumentState>()((set) => ({
  ...initialState,

  setPage: (page) =>
    set({
      page,
      title: page?.title ?? '',
      content: page?.content ?? '',
      savedTitle: page?.title ?? '',
      savedContent: page?.content ?? '',
      saveStatus: 'saved',
      draftAvailable: false,
      cursor: { line: 1, col: 1 },
      selection: { from: 0, to: 0 },
    }),

  setTitle: (title) =>
    set({ title }),

  setContent: (content) =>
    set({ content }),

  markSaved: (title, content) =>
    set({
      savedTitle: title,
      savedContent: content,
      saveStatus: 'saved',
    }),

  markSaving: () =>
    set({ saveStatus: 'saving' }),

  markUnsaved: () =>
    set({ saveStatus: 'unsaved' }),

  setDraftAvailable: (draftAvailable) =>
    set({ draftAvailable }),

  setCursor: (cursor) =>
    set({ cursor }),

  setSelection: (selection) =>
    set({ selection }),

  setSnapshots: (snapshots) =>
    set({ snapshots, isSnapshotsLoading: false }),

  setSnapshotsLoading: (isSnapshotsLoading) =>
    set({ isSnapshotsLoading }),

  reset: () =>
    set(initialState),
}))

// ─── Derived Selectors ──────────────────────────────────────────

export function selectDocumentPage(state: DocumentState) {
  return state.page
}

export function selectDocumentTitle(state: DocumentState) {
  return state.title
}

export function selectDocumentContent(state: DocumentState) {
  return state.content
}

export function selectDocumentSavedTitle(state: DocumentState) {
  return state.savedTitle
}

export function selectDocumentSavedContent(state: DocumentState) {
  return state.savedContent
}

export function selectDocumentIsDirty(state: DocumentState) {
  return state.title !== state.savedTitle || state.content !== state.savedContent
}

export function selectDocumentSaveStatus(state: DocumentState) {
  return state.saveStatus
}

export function selectDocumentIsSaving(state: DocumentState) {
  return state.isSaving
}

export function selectDocumentDraftAvailable(state: DocumentState) {
  return state.draftAvailable
}

export function selectDocumentCursor(state: DocumentState) {
  return state.cursor
}

export function selectDocumentSelection(state: DocumentState) {
  return state.selection
}

export function selectDocumentSnapshots(state: DocumentState) {
  return state.snapshots
}

export function selectDocumentSnapshotsLoading(state: DocumentState) {
  return state.isSnapshotsLoading
}

export function selectDocumentWordCount(state: DocumentState) {
  return state.content.trim()
    ? state.content.trim().split(/\s+/).length
    : 0
}

export function selectDocumentCharCount(state: DocumentState) {
  return state.content.length
}

export function selectDocumentReadingTime(state: DocumentState) {
  const words = state.content.trim()
    ? state.content.trim().split(/\s+/).length
    : 0
  return Math.max(1, Math.ceil(words / 200))
}

export function selectDocumentHasPage(state: DocumentState) {
  return state.page !== null
}
