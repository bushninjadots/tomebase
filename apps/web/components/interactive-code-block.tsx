'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Code2, Terminal, FileCode } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  executable?: boolean;
  onRun?: (code: string) => void;
}

const LANGUAGE_ICONS: Record<string, typeof Code2> = {
  javascript: Code2,
  typescript: Code2,
  python: Code2,
  ruby: Code2,
  go: Code2,
  rust: Code2,
  java: Code2,
  csharp: Code2,
  cpp: Code2,
  c: Code2,
  php: Code2,
  swift: Code2,
  kotlin: Code2,
  sql: FileCode,
  bash: Terminal,
  shell: Terminal,
  powershell: Terminal,
  json: FileCode,
  yaml: FileCode,
  yml: FileCode,
  xml: FileCode,
  html: FileCode,
  css: FileCode,
};

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  py: 'Python',
  rb: 'Ruby',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  cs: 'C#',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
  swift: 'Swift',
  kt: 'Kotlin',
  sql: 'SQL',
  bash: 'Bash',
  sh: 'Shell',
  powershell: 'PowerShell',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  md: 'Markdown',
  tsx: 'TSX',
  jsx: 'JSX',
};

export function CodeBlock({
  code,
  language = 'text',
  filename,
  showLineNumbers = false,
  highlightLines = [],
  executable = false,
  onRun,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const normalizedLang = language.toLowerCase().replace(/^(lang:|language:)/, '').trim();
  const displayLang = LANGUAGE_LABELS[normalizedLang] || normalizedLang.toUpperCase();
  const LangIcon = LANGUAGE_ICONS[normalizedLang] || Code2;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const handleRun = useCallback(async () => {
    if (!onRun) return;
    setIsRunning(true);
    try {
      await onRun(code);
    } finally {
      setIsRunning(false);
    }
  }, [code, onRun]);

  const lines = code.split('\n');
  const lineCount = lines.length;

  return (
    <div className="group relative my-4 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LangIcon className="h-4 w-4" />
          {filename ? (
            <span className="font-mono text-xs">{filename}</span>
          ) : (
            <span className="text-xs">{displayLang}</span>
          )}
          {showLineNumbers && (
            <span className="text-xs text-gray-400">({lineCount} lines)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {executable && onRun && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                  Running...
                </>
              ) : (
                <>
                  <Terminal className="h-3 w-3" />
                  Run
                </>
              )}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm">
          <code className="font-mono text-gray-800">
            {showLineNumbers ? (
              <table className="border-collapse">
                <tbody>
                  {lines.map((line, i) => (
                    <tr
                      key={i}
                      className={`${
                        highlightLines.includes(i + 1)
                          ? 'bg-yellow-100 -mx-4 px-4'
                          : ''
                      }`}
                    >
                      <td className="pr-4 text-right text-gray-400 select-none whitespace-nowrap align-top">
                        {i + 1}
                      </td>
                      <td className="whitespace-pre">{line || ' '}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span className="whitespace-pre">{code}</span>
            )}
          </code>
        </pre>
      </div>

      {/* Highlight line indicator */}
      {highlightLines.length > 0 && (
        <div className="border-t border-gray-200 bg-yellow-50 px-4 py-1 text-xs text-yellow-700">
          Lines {highlightLines.join(', ')} highlighted
        </div>
      )}
    </div>
  );
}

interface MultiLanguageCodeBlockProps {
  variants: Array<{
    language: string;
    code: string;
    filename?: string;
    label?: string;
  }>;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  executable?: boolean;
  onRun?: (code: string, language: string) => void;
}

export function MultiLanguageCodeBlock({
  variants,
  showLineNumbers = false,
  highlightLines = [],
  executable = false,
  onRun,
}: MultiLanguageCodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (variants.length === 0) return null;
  if (variants.length === 1) {
    const v = variants[0]!;
    return (
      <CodeBlock
        code={v.code}
        language={v.language}
        filename={v.filename}
        showLineNumbers={showLineNumbers}
        highlightLines={highlightLines}
        executable={executable}
        onRun={onRun ? (code) => onRun(code, v.language) : undefined}
      />
    );
  }

  return (
    <div className="my-4">
      {/* Language tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-100 px-2 pt-2">
        {variants.map((v, i) => {
          const LangIcon = LANGUAGE_ICONS[v.language.toLowerCase()] || Code2;
          const displayLabel = v.label || LANGUAGE_LABELS[v.language.toLowerCase()] || v.language.toUpperCase();
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === i
                  ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LangIcon className="h-3 w-3" />
              {displayLabel}
            </button>
          );
        })}
      </div>

      {/* Active code block */}
      <div className="rounded-b-xl border border-t-0 border-gray-200">
        <CodeBlock
          code={variants[activeTab]!.code}
          language={variants[activeTab]!.language}
          filename={variants[activeTab]!.filename}
          showLineNumbers={showLineNumbers}
          highlightLines={highlightLines}
          executable={executable}
          onRun={onRun ? (code) => onRun(code, variants[activeTab]!.language) : undefined}
        />
      </div>
    </div>
  );
}