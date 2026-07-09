export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'go' | 'rust';

export interface LanguageConfig {
  name: string;
  extensions: string[];
  commentStyle: 'jsdoc' | 'python' | 'cstyle';
}

export const supportedLanguages: Record<SupportedLanguage, LanguageConfig> = {
  typescript: { name: 'TypeScript', extensions: ['.ts', '.tsx'], commentStyle: 'jsdoc' },
  javascript: { name: 'JavaScript', extensions: ['.js', '.jsx'], commentStyle: 'jsdoc' },
  python: { name: 'Python', extensions: ['.py'], commentStyle: 'python' },
  go: { name: 'Go', extensions: ['.go'], commentStyle: 'cstyle' },
  rust: { name: 'Rust', extensions: ['.rs'], commentStyle: 'cstyle' },
};
