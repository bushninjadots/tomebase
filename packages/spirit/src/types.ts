export type SpiritMode = 'floating' | 'docked' | 'minimized' | 'hidden';

export type SpiritAIState =
  | 'idle'
  | 'sleeping'
  | 'thinking'
  | 'responding'
  | 'reading'
  | 'publishing'
  | 'warning'
  | 'offline'
  | 'error';

export type SpiritGhostSize = 'small' | 'medium' | 'large';

export interface SpiritProposal {
  id: string;
  changeType: 'replace' | 'insert' | 'delete';
  originalContent: string;
  proposedContent: string;
  explanation: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface SpiritMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  citations?: SpiritCitation[];
  toolCalls?: SpiritToolCall[];
  isStreaming?: boolean;
  proposal?: SpiritProposal;
}

export interface SpiritCitation {
  pageTitle: string;
  pageSlug: string;
  snippet: string;
}

export interface SpiritToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

export interface SpiritConversation {
  id: string;
  title: string;
  messages: SpiritMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface SpiritSuggestion {
  id: string;
  type: 'info' | 'warning' | 'action';
  message: string;
  action?: { label: string; handler: () => void };
  dismissible: boolean;
  createdAt: number;
}

export interface SpiritShortcut {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  action: string;
}

export interface SpiritContext {
  projectId: string | null;
  currentPage: { title: string; slug: string; id: string } | null;
  currentSelection: string;
  currentLanguage: string;
  currentTheme: string;
  openTabs: number;
  currentFolder: string;
  recentEdits: number;
}

export interface SpiritPreferences {
  enabled: boolean;
  animationIntensity: number;
  reducedMotion: boolean;
  transparency: number;
  ghostSize: SpiritGhostSize;
  opacity: number;
  defaultMode: SpiritMode;
  dockSide: 'left' | 'right';
  dockWidth: number;
  personalityLevel: number;
  autoSuggestions: boolean;
  workspaceAwareness: boolean;
  shortcut: SpiritShortcut;
}

export interface SpiritStore {
  mode: SpiritMode;
  aiState: SpiritAIState;
  isOpen: boolean;
  isPinned: boolean;
  position: { x: number; y: number };
  conversations: SpiritConversation[];
  activeConversationId: string | null;
  suggestions: SpiritSuggestion[];
  context: SpiritContext;
  preferences: SpiritPreferences;

  setMode: (mode: SpiritMode) => void;
  toggle: () => void;
  open: () => void;
  close: () => void;
  pin: () => void;
  unpin: () => void;
  setAIState: (state: SpiritAIState) => void;
  setPosition: (pos: { x: number; y: number }) => void;
  setContext: (ctx: Partial<SpiritContext>) => void;
  addMessage: (message: SpiritMessage) => void;
  updateLastMessage: (content: string) => void;
  setActiveConversation: (id: string) => void;
  createConversation: () => string;
  addSuggestion: (suggestion: SpiritSuggestion) => void;
  dismissSuggestion: (id: string) => void;
  updatePreferences: (prefs: Partial<SpiritPreferences>) => void;
  resetPosition: () => void;
}

export const DEFAULT_POSITION = { x: 24, y: 24 };

export const DEFAULT_PREFERENCES: SpiritPreferences = {
  enabled: true,
  animationIntensity: 70,
  reducedMotion: false,
  transparency: 0,
  ghostSize: 'medium',
  opacity: 100,
  defaultMode: 'floating',
  dockSide: 'right',
  dockWidth: 380,
  personalityLevel: 50,
  autoSuggestions: true,
  workspaceAwareness: true,
  shortcut: { key: 'j', ctrl: true, shift: false, alt: false, action: 'toggle' },
};

export const DEFAULT_CONTEXT: SpiritContext = {
  projectId: null,
  currentPage: null,
  currentSelection: '',
  currentLanguage: '',
  currentTheme: '',
  openTabs: 0,
  currentFolder: '',
  recentEdits: 0,
};
