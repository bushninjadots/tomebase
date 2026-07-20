export interface PageCreatedEvent {
  pageId: string
  projectId: string
}

export interface PageUpdatedEvent {
  pageId: string
  projectId: string
  changes: {
    title?: string
    content?: string
    published?: boolean
  }
}

export interface PageDeletedEvent {
  pageId: string
  projectId: string
}

export interface PageMovedEvent {
  pageId: string
  projectId: string
  newParentId: string | null
  newOrder: number
}

export interface PagePublishedEvent {
  pageId: string
  projectId: string
}

export interface PageUnpublishedEvent {
  pageId: string
  projectId: string
}

export interface DocumentLoadedEvent {
  pageId: string
  title: string
  content: string
}

export interface DocumentSavedEvent {
  pageId: string
  content: string
  snapshotId: string
}

export interface DocumentRestoredEvent {
  pageId: string
  snapshotId: string
  previousContent: string
}

export interface DocumentDirtyEvent {
  pageId: string
}

export interface DocumentCleanEvent {
  pageId: string
}

export interface ProjectLoadedEvent {
  projectId: string
}

export interface ProjectPublishedEvent {
  projectId: string
}

export interface ProjectUnpublishedEvent {
  projectId: string
}

export interface ProjectDeletedEvent {
  projectId: string
}

export interface HealthScannedEvent {
  projectId: string
  score: number
  previousScore: number | null
}

export interface HealthScoreChangedEvent {
  projectId: string
  previousScore: number
  newScore: number
}

export interface DiagnosticFixedEvent {
  projectId: string
  pageId: string
  diagnosticId: string
}

export interface DiagnosticIgnoredEvent {
  projectId: string
  diagnosticId: string
}

export interface ImportStartedEvent {
  projectId: string
  type: 'code' | 'openapi' | 'github'
}

export interface ImportCompletedEvent {
  projectId: string
  type: 'code' | 'openapi' | 'github'
  pagesCreated: number
}

export interface ImportFailedEvent {
  projectId: string
  type: 'code' | 'openapi' | 'github'
  error: string
}

export interface SyncStartedEvent {
  projectId: string
  repo: string
}

export interface SyncCompletedEvent {
  projectId: string
  created: number
  updated: number
}

export interface SyncFailedEvent {
  projectId: string
  error: string
}

export interface AiResponseEvent {
  operation: string
  content: string
  tokens: number
}

export interface AiErrorEvent {
  operation: string
  error: string
}

export interface AiStreamingStartedEvent {
  operation: string
}

export interface AiStreamingChunkEvent {
  operation: string
  chunk: string
}

export interface AiStreamingDoneEvent {
  operation: string
}

export interface AiProposalCreatedEvent {
  proposalId: string
  pageId: string
  changeType: string
  source: string
}

export interface AiProposalAcceptedEvent {
  proposalId: string
  pageId: string
}

export interface AiProposalRejectedEvent {
  proposalId: string
  pageId: string
}

export interface EventBusEvents {
  'page:created': PageCreatedEvent
  'page:updated': PageUpdatedEvent
  'page:deleted': PageDeletedEvent
  'page:moved': PageMovedEvent
  'page:published': PagePublishedEvent
  'page:unpublished': PageUnpublishedEvent

  'document:loaded': DocumentLoadedEvent
  'document:saved': DocumentSavedEvent
  'document:restored': DocumentRestoredEvent
  'document:dirty': DocumentDirtyEvent
  'document:clean': DocumentCleanEvent

  'project:loaded': ProjectLoadedEvent
  'project:published': ProjectPublishedEvent
  'project:unpublished': ProjectUnpublishedEvent
  'project:deleted': ProjectDeletedEvent

  'health:scanned': HealthScannedEvent
  'health:scoreChanged': HealthScoreChangedEvent
  'diagnostic:fixed': DiagnosticFixedEvent
  'diagnostic:ignored': DiagnosticIgnoredEvent

  'import:started': ImportStartedEvent
  'import:completed': ImportCompletedEvent
  'import:failed': ImportFailedEvent

  'sync:started': SyncStartedEvent
  'sync:completed': SyncCompletedEvent
  'sync:failed': SyncFailedEvent

  'ai:response': AiResponseEvent
  'ai:error': AiErrorEvent
  'ai:streamingStarted': AiStreamingStartedEvent
  'ai:streamingChunk': AiStreamingChunkEvent
  'ai:streamingDone': AiStreamingDoneEvent
  'ai:proposalCreated': AiProposalCreatedEvent
  'ai:proposalAccepted': AiProposalAcceptedEvent
  'ai:proposalRejected': AiProposalRejectedEvent
}

export type EventName = keyof EventBusEvents
export type EventPayload<T extends EventName> = EventBusEvents[T]
