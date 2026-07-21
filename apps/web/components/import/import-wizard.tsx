'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { Button } from '@fluid/ui';
import {
  Code2,
  ArrowRight,
  FileCode,
  Check,
  ExternalLink,
  GitBranch,
  RotateCcw,
  ArrowUpRight,
  FileJson,
  Globe,
  Upload,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useImportWizard } from './use-import-wizard';
import { ImportProgress } from './import-progress';
import { DocumentationPreview } from './documentation-preview';
import { HealthSummary } from './health-summary';
import { useToast } from '@/components/toast';
import type { GeneratedPage, ExportKind } from './use-import-wizard';
import { languages, sampleCode, sampleSpec } from './import-wizard-data';

interface ImportWizardProps {
  projectId: string;
  projectName: string;
}

type ImportTab = 'code' | 'openapi';

const KIND_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  function: { label: 'Function', icon: Code2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  interface: { label: 'Interface', icon: FileCode, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  type: { label: 'Type', icon: FileCode, color: 'text-green-400', bg: 'bg-green-500/10' },
  class: { label: 'Class', icon: FileCode, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  enum: { label: 'Enum', icon: FileCode, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  namespace: { label: 'Namespace', icon: FileCode, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

function PageCard({ page, isSelected, onSelect }: { page: GeneratedPage; isSelected: boolean; onSelect: () => void }) {
  const defaultConfig = { label: 'Function', icon: Code2, color: 'text-blue-400', bg: 'bg-blue-500/10' };
  const config = KIND_CONFIG[page.kind] ?? defaultConfig;
  const Icon = config.icon;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-150 ${
        isSelected
          ? 'bg-theme-accent/10 border border-theme-accent/25 shadow-sm'
          : 'border border-transparent hover:bg-theme-hover hover:border-theme-border'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-theme-accent' : 'text-theme-main'}`}>
            {page.title}
          </p>
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${config.bg} ${config.color} shrink-0`}>
            {config.label}
          </span>
        </div>
        {page.description && (
          <p className="text-xs text-theme-muted mt-0.5 line-clamp-1">{page.description}</p>
        )}
        <p className="text-[11px] text-theme-muted/60 mt-1">{page.wordCount} words</p>
      </div>
      {isSelected && <Check className="h-4 w-4 text-theme-accent shrink-0 mt-1" />}
    </button>
  );
}

const MemoizedPageCard = memo(PageCard);

export function ImportWizard({ projectId, projectName }: ImportWizardProps) {
  const { addToast } = useToast();
  const wizard = useImportWizard({ projectId, onToast: addToast });
  const summaryRef = useRef<HTMLDivElement>(null);
  const [selectedPreviewSlug, setSelectedPreviewSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ImportTab>('code');

  const [openApiMode, setOpenApiMode] = useState<'paste' | 'url'>('paste');
  const [openApiSpec, setOpenApiSpec] = useState('');
  const [openApiUrl, setOpenApiUrl] = useState('');
  const [openApiLoading, setOpenApiLoading] = useState(false);

  const isSuccess = wizard.state === 'success' && wizard.result && wizard.result.pages.length > 0;
  const isGenerating = wizard.state === 'generating';

  useEffect(() => {
    if (wizard.state === 'success' && wizard.result && wizard.result.pages.length > 0) {
      setSelectedPreviewSlug(wizard.result.pages[0]?.slug ?? null);
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [wizard.state, wizard.result]);

  const handleCodeSubmit = useCallback(() => {
    wizard.generate(wizard.code, wizard.language);
  }, [wizard]);

  const loadSample = useCallback(() => {
    const sample = sampleCode[wizard.language as keyof typeof sampleCode] ?? sampleCode.typescript;
    if (sample) wizard.setCode(sample);
  }, [wizard]);

  const handleGenerateMore = useCallback(() => {
    wizard.reset();
    setSelectedPreviewSlug(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizard]);

  const handleConflictReplace = useCallback(() => {
    wizard.generate(wizard.code, wizard.language, 'replace');
  }, [wizard]);

  const handleConflictSkip = useCallback(() => {
    wizard.generate(wizard.code, wizard.language, 'skip');
  }, [wizard]);

  const handleOpenApiSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (openApiMode === 'paste' && !openApiSpec.trim()) return;
    if (openApiMode === 'url' && !openApiUrl.trim()) return;

    const specOrUrl = openApiMode === 'paste'
      ? { spec: openApiSpec }
      : { url: openApiUrl };

    await wizard.importOpenApi(specOrUrl);
  }, [wizard, openApiMode, openApiSpec, openApiUrl]);

  return (
    <div className="space-y-0">
      {/* Success State — Full Redesign */}
      {isSuccess && wizard.result && (
        <div ref={summaryRef} className="space-y-6 animate-[slideUp_0.4s_ease-out]">
          {/* Completion Banner */}
          <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-theme-main">
                    {wizard.result.importType === 'openapi'
                      ? `Imported from ${wizard.result.specTitle ?? 'OpenAPI spec'}`
                      : 'Documentation generated'}
                  </h2>
                  <p className="text-sm text-theme-muted mt-0.5">
                    {wizard.result.pages.length} page{wizard.result.pages.length === 1 ? '' : 's'} created
                    {wizard.result.skipped.length > 0 && ` · ${wizard.result.skipped.length} skipped`}
                    {wizard.result.stats.generationTimeMs > 0 && ` · ${(wizard.result.stats.generationTimeMs / 1000).toFixed(1)}s`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/docs/${projectId}/${wizard.result.pages[0]?.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-theme-accent text-gray-900 px-4 py-2.5 text-sm font-semibold hover:bg-theme-accent-hover transition-all duration-150 shadow-sm hover:shadow-md"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Editor
                </Link>
                <Link
                  href={`/docs/${projectId}/graph`}
                  className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
                >
                  <GitBranch className="h-4 w-4" />
                  Graph
                </Link>
                <button
                  onClick={handleGenerateMore}
                  className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Import More
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-theme-muted">
              {wizard.result.stats.functions > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-theme-hover px-2.5 py-1.5">
                  <Code2 className="h-3 w-3 text-blue-400" />
                  {wizard.result.stats.functions} functions
                </span>
              )}
              {wizard.result.stats.interfaces > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-theme-hover px-2.5 py-1.5">
                  <FileCode className="h-3 w-3 text-purple-400" />
                  {wizard.result.stats.interfaces} interfaces
                </span>
              )}
              {wizard.result.stats.types > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-theme-hover px-2.5 py-1.5">
                  <FileCode className="h-3 w-3 text-green-400" />
                  {wizard.result.stats.types} types
                </span>
              )}
              {wizard.result.stats.classes > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-theme-hover px-2.5 py-1.5">
                  <FileCode className="h-3 w-3 text-amber-400" />
                  {wizard.result.stats.classes} classes
                </span>
              )}
              {wizard.result.stats.enums > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-theme-hover px-2.5 py-1.5">
                  <FileCode className="h-3 w-3 text-rose-400" />
                  {wizard.result.stats.enums} enums
                </span>
              )}
              {wizard.result.stats.generationTimeMs > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-theme-hover px-2.5 py-1.5">
                  <Sparkles className="h-3 w-3 text-theme-accent" />
                  {(wizard.result.stats.generationTimeMs / 1000).toFixed(1)}s generation time
                </span>
              )}
            </div>
          </div>

          {/* Split Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
            {/* Pages List */}
            <div className="border-b lg:border-b-0 lg:border-r border-theme-border">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme-border bg-theme-surface/50">
                <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
                  Generated Pages
                </h3>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/docs/${projectId}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Editor
                  </Link>
                  <Link
                    href={`/docs/${projectId}/graph`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
                  >
                    <GitBranch className="h-3 w-3" />
                    Graph
                  </Link>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto p-2 space-y-0.5">
                {wizard.result.pages.map((page) => (
                  <MemoizedPageCard
                    key={page.id}
                    page={page}
                    isSelected={selectedPreviewSlug === page.slug}
                    onSelect={() => setSelectedPreviewSlug(page.slug)}
                  />
                ))}
              </div>
              <div className="px-5 py-2.5 border-t border-theme-border bg-theme-surface/30">
                <span className="text-[11px] text-theme-muted">
                  {wizard.result.pages.length} page{wizard.result.pages.length === 1 ? '' : 's'} generated
                  {wizard.result.skipped.length > 0 && ` · ${wizard.result.skipped.length} skipped`}
                </span>
              </div>
            </div>

            {/* Preview */}
            <div>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme-border bg-theme-surface/50">
                <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
                  Live Preview
                </h3>
                {selectedPreviewSlug && (
                  <Link
                    href={`/docs/${projectId}/${selectedPreviewSlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </Link>
                )}
              </div>
              <div className="min-h-[400px] max-h-[500px] overflow-y-auto p-5">
                <DocumentationPreview
                  projectId={projectId}
                  slug={selectedPreviewSlug}
                />
              </div>
            </div>
          </div>

          {/* Health Summary */}
          <HealthSummary projectId={projectId} />

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/docs/${projectId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-theme-accent text-gray-900 px-5 py-2.5 text-sm font-semibold hover:bg-theme-accent-hover transition-all duration-150"
            >
              <ArrowUpRight className="h-4 w-4" />
              View Documentation
            </Link>
            <button
              onClick={handleGenerateMore}
              className="inline-flex items-center gap-2 rounded-lg border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Pre-success States */}
      {!isSuccess && (
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex gap-1 rounded-xl border border-theme-border bg-theme-card p-1">
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeTab === 'code'
                  ? 'bg-theme-hover text-theme-main shadow-sm border border-theme-border'
                  : 'text-theme-muted hover:text-theme-main border border-transparent'
              }`}
            >
              <Code2 className="inline h-4 w-4 mr-1.5" />
              From Code
            </button>
            <button
              onClick={() => setActiveTab('openapi')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeTab === 'openapi'
                  ? 'bg-theme-hover text-theme-main shadow-sm border border-theme-border'
                  : 'text-theme-muted hover:text-theme-main border border-transparent'
              }`}
            >
              <FileJson className="inline h-4 w-4 mr-1.5" />
              OpenAPI Spec
            </button>
          </div>

          {/* Code Tab */}
          {activeTab === 'code' && (
            <>
              {/* IDLE / VALIDATING state */}
              {(wizard.state === 'idle' || wizard.state === 'validating') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="code" className="text-sm font-medium text-theme-subtle">Source Code</label>
                        <button type="button" onClick={loadSample} className="text-xs text-theme-accent hover:text-theme-accent/80 transition-colors">
                          Load sample
                        </button>
                      </div>
                      <textarea
                        id="code"
                        value={wizard.code}
                        onChange={(e) => wizard.setCode(e.target.value)}
                        rows={20}
                        className="code-editor"
                        placeholder={`// Paste your code here...\n// Supported: TypeScript, JavaScript, Python, Go, Rust, C#, C++, Kotlin, Ruby\n`}
                        spellCheck={false}
                        disabled={wizard.state === 'validating'}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="language" className="text-sm font-medium text-theme-subtle">Language</label>
                        <select
                          id="language"
                          value={wizard.language}
                          onChange={(e) => wizard.setLanguage(e.target.value)}
                          disabled={wizard.state === 'validating'}
                          className="select-field px-4 py-2.5"
                        >
                          {languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-theme-muted pt-6">
                        Paste code with doc comments (JSDoc, docstrings, Go doc, Rust doc, XML doc, KDoc, YARD)
                      </p>
                    </div>

                    <Button onClick={handleCodeSubmit} disabled={wizard.state === 'validating' || !wizard.code.trim()} size="lg">
                      {wizard.state === 'validating' ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-gray-900/30 border-t-gray-900 animate-spin" />
                          Analyzing Source...
                        </>
                      ) : (
                        <>
                          <Code2 className="h-4 w-4" />
                          Generate Documentation
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-theme-border bg-theme-card p-5">
                      <h3 className="text-sm font-semibold text-theme-main mb-3">Supported Exports</h3>
                      <div className="space-y-2">
                        {['Exported functions', 'Exported classes', 'Exported interfaces', 'Exported types', 'Exported enums', 'React components & hooks', 'JSDoc comments'].map((f) => (
                          <div key={f} className="flex items-center gap-2.5 text-sm">
                            <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
                            <span className="text-theme-subtle">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-theme-border bg-theme-card p-5">
                      <h3 className="text-sm font-semibold text-theme-main mb-3">Tips</h3>
                      <div className="space-y-2.5">
                        <p className="text-xs text-theme-muted leading-relaxed">
                          Each exported function becomes a documentation page with parameters, return types, and usage examples.
                        </p>
                        <p className="text-xs text-theme-muted leading-relaxed">
                          Interfaces, types, and enums become reference pages with field descriptions.
                        </p>
                        <p className="text-xs text-theme-muted leading-relaxed">
                          Cross-references between types are automatically linked with [[wiki links]].
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GENERATING state */}
              {wizard.state === 'generating' && <ImportProgress steps={wizard.steps} />}

              {/* ERROR state */}
              {wizard.state === 'error' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 animate-[fadeIn_0.3s_ease-out]">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-red-400 text-xs font-bold">!</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-red-400 font-medium">{wizard.error}</p>
                        <div className="text-xs text-theme-muted space-y-1">
                          {wizard.error?.includes('No functions') || wizard.error?.includes('No exports') ? (
                            <>
                              <p>Your code has no exported functions or classes with doc comments.</p>
                              <p className="text-theme-muted">Try adding JSDoc comments to your exported functions:</p>
                              <pre className="mt-1 p-2 bg-theme-hover rounded text-[11px] text-theme-subtle font-mono">
{`/** Description of what this does */
export function myFunction(param) { ... }`}
                              </pre>
                            </>
                          ) : wizard.error?.includes('rate limit') ? (
                            <p>Too many requests. Wait a moment and try again.</p>
                          ) : wizard.error?.includes('network') || wizard.error?.includes('fetch') ? (
                            <p>Check your connection and try again.</p>
                          ) : (
                            <>
                              <p>If this keeps happening, try:</p>
                              <ul className="list-disc list-inside space-y-0.5 mt-1">
                                <li>Paste smaller code snippets (one file at a time)</li>
                                <li>Ensure code has exported functions with doc comments</li>
                                <li>Try a different language from the dropdown</li>
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleGenerateMore} variant="outline">Try Again</Button>
                    <Button onClick={() => wizard.reset()} variant="ghost" size="sm">Clear & Start Over</Button>
                  </div>
                </div>
              )}

              {/* ZERO state */}
              {wizard.state === 'zero' && (
                <div className="flex flex-col items-center justify-center py-16 animate-[fadeIn_0.3s_ease-out]">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 mb-4">
                    <AlertCircle className="h-7 w-7 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-bold text-theme-main">No documentation could be generated</h2>
                  <p className="mt-1 text-sm text-theme-muted text-center max-w-md">
                    We only generate documentation from exported items. Make sure your code exports functions, classes, interfaces, types, or enums with documentation comments.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={loadSample}
                      className="inline-flex items-center gap-2 rounded-lg bg-theme-accent text-gray-900 px-4 py-2.5 text-sm font-semibold hover:bg-theme-accent-hover transition-colors"
                    >
                      <FileCode className="h-4 w-4" />
                      Load Example
                    </button>
                  </div>
                </div>
              )}

              {/* CONFLICTS state */}
              {wizard.state === 'conflicts' && wizard.result && (
                <div className="space-y-6 animate-[slideUp_0.4s_ease-out]">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                    <p className="text-sm font-medium text-amber-400">
                      {wizard.result.skipped.length} page{wizard.result.skipped.length > 1 ? 's' : ''} already existed.
                    </p>
                    <div className="mt-4 flex justify-center gap-3">
                      <Button onClick={handleConflictReplace} variant="outline" size="sm">Replace All</Button>
                      <Button onClick={handleConflictSkip} variant="outline" size="sm">Skip</Button>
                    </div>
                  </div>
                  <Button onClick={handleGenerateMore} variant="ghost">Back to Editor</Button>
                </div>
              )}
            </>
          )}

          {/* OpenAPI Tab */}
          {activeTab === 'openapi' && (
            <>
              {isGenerating && <ImportProgress steps={wizard.steps} />}

              {!isGenerating && (
                <form onSubmit={handleOpenApiSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5">
                      <div className="flex gap-1 rounded-xl border border-theme-border bg-theme-card p-1">
                        <button
                          type="button"
                          onClick={() => setOpenApiMode('paste')}
                          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                            openApiMode === 'paste'
                              ? 'bg-theme-surface text-theme-main shadow-sm border border-theme-border'
                              : 'text-theme-muted hover:text-theme-main border border-transparent'
                          }`}
                        >
                          <FileJson className="inline h-4 w-4 mr-1.5" />
                          Paste Spec
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenApiMode('url')}
                          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                            openApiMode === 'url'
                              ? 'bg-theme-surface text-theme-main shadow-sm border border-theme-border'
                              : 'text-theme-muted hover:text-theme-main border border-transparent'
                          }`}
                        >
                          <Globe className="inline h-4 w-4 mr-1.5" />
                          Fetch from URL
                        </button>
                      </div>

                      {openApiMode === 'paste' ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label htmlFor="spec" className="text-sm font-medium text-theme-subtle">
                              OpenAPI Spec (JSON or YAML)
                            </label>
                            <button
                              type="button"
                              onClick={() => setOpenApiSpec(sampleSpec)}
                              className="text-xs text-theme-accent hover:text-theme-accent/80 transition-colors"
                            >
                              Load sample
                            </button>
                          </div>
                          <textarea
                            id="spec"
                            value={openApiSpec}
                            onChange={(e) => setOpenApiSpec(e.target.value)}
                            rows={18}
                            className="code-editor"
                            placeholder={`openapi: "3.0.0"\ninfo:\n  title: My API\n  version: "1.0.0"\npaths:\n  ...`}
                            spellCheck={false}
                          />
                          <p className="text-xs text-theme-muted">
                            Supports OpenAPI 3.0 and 3.1 specs in JSON or YAML format.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label htmlFor="url" className="text-sm font-medium text-theme-subtle">
                            Spec URL
                          </label>
                          <input
                            id="url"
                            type="url"
                            value={openApiUrl}
                            onChange={(e) => setOpenApiUrl(e.target.value)}
                            placeholder="https://raw.githubusercontent.com/..."
                            className="input-field"
                          />
                          <p className="text-xs text-theme-muted">
                            URL must be publicly accessible and return a valid OpenAPI spec (JSON/YAML).
                          </p>
                        </div>
                      )}

                      {/* Error state */}
                      {wizard.state === 'error' && wizard.error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 animate-[fadeIn_0.3s_ease-out]">
                          <div className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-red-400 text-xs font-bold">!</span>
                            </div>
                            <div>
                              <p className="text-sm text-red-400 font-medium">{wizard.error}</p>
                              <p className="text-xs text-theme-muted mt-1">
                                Check that your spec is valid JSON or YAML and try again.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={wizard.state === 'generating' || (openApiMode === 'paste' && !openApiSpec.trim()) || (openApiMode === 'url' && !openApiUrl.trim())}
                        size="lg"
                      >
                        {wizard.state === 'generating' ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-gray-900/30 border-t-gray-900 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Import API Endpoints
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-theme-border bg-theme-card p-5">
                        <h3 className="text-sm font-semibold text-theme-main mb-3">What gets imported</h3>
                        <div className="space-y-2">
                          {['One page per API endpoint', 'HTTP method & path', 'Parameters & request body', 'Response descriptions', 'Operation IDs', 'Grouped by tags'].map((f) => (
                            <div key={f} className="flex items-center gap-2.5 text-sm">
                              <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
                              <span className="text-theme-subtle">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-theme-border bg-theme-card p-5">
                        <h3 className="text-sm font-semibold text-theme-main mb-3">Supported Formats</h3>
                        <div className="space-y-2.5">
                          <p className="text-xs text-theme-muted leading-relaxed">
                            OpenAPI 3.0 and 3.1 specifications in JSON or YAML format.
                          </p>
                          <p className="text-xs text-theme-muted leading-relaxed">
                            Each endpoint becomes a documentation page with parameters, request body, and response details.
                          </p>
                          <p className="text-xs text-theme-muted leading-relaxed">
                            Up to 100 endpoints per import.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
