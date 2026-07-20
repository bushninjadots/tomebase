export type {
  AIProviderType,
  AIProviderConfig,
  StoredAIProviderConfig,
  AIMessage,
  AIOperation,
  AIRequest,
  AIResponse,
  AIStreamCallbacks,
  AIContextContribution,
  AIContextProvider,
  AIProviderMeta,
} from './types'

export {
  registerContextProvider,
  unregisterContextProvider,
  setContextEnabled,
  isContextEnabled,
  collectContext,
  contributionsToString,
  clearAllProviders,
} from './context'

export {
  streamChat,
  streamChatWithFallback,
} from './streaming'
export type { StreamRequest } from './streaming'

export { aiService } from './service'
export type { AIServiceConfig } from './service'
