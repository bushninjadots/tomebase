export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'csharp' | 'cpp' | 'kotlin' | 'ruby';

export interface LanguageConfig {
  name: string;
  extensions: string[];
  commentStyle: 'jsdoc' | 'python' | 'cstyle' | 'xml' | 'yard';
}

export const supportedLanguages: Record<SupportedLanguage, LanguageConfig> = {
  typescript: { name: 'TypeScript', extensions: ['.ts', '.tsx'], commentStyle: 'jsdoc' },
  javascript: { name: 'JavaScript', extensions: ['.js', '.jsx'], commentStyle: 'jsdoc' },
  python: { name: 'Python', extensions: ['.py'], commentStyle: 'python' },
  go: { name: 'Go', extensions: ['.go'], commentStyle: 'cstyle' },
  rust: { name: 'Rust', extensions: ['.rs'], commentStyle: 'cstyle' },
  csharp: { name: 'C#', extensions: ['.cs'], commentStyle: 'xml' },
  cpp: { name: 'C++', extensions: ['.cpp', '.cc', '.h', '.hpp'], commentStyle: 'cstyle' },
  kotlin: { name: 'Kotlin', extensions: ['.kt', '.kts'], commentStyle: 'jsdoc' },
  ruby: { name: 'Ruby', extensions: ['.rb'], commentStyle: 'yard' },
};
