'use client';

import { useState } from 'react';
import { Code2, FileJson } from 'lucide-react';
import { ImportForm } from './form';
import { OpenApiForm } from './openapi-form';

interface ImportTabsProps {
  projectId: string;
}

export function ImportTabs({ projectId }: ImportTabsProps) {
  const [tab, setTab] = useState<'code' | 'openapi'>('code');

  return (
    <div>
      <div className="flex gap-1 rounded-xl border border-theme-border bg-theme-card p-1 mb-8">
        <button
          onClick={() => setTab('code')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'code'
              ? 'bg-theme-hover text-theme-main shadow-sm border border-theme-border'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <Code2 className="inline h-4 w-4 mr-1.5" />
          From Code
        </button>
        <button
          onClick={() => setTab('openapi')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'openapi'
              ? 'bg-theme-hover text-theme-main shadow-sm border border-theme-border'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <FileJson className="inline h-4 w-4 mr-1.5" />
          OpenAPI Spec
        </button>
      </div>

      {tab === 'code' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Code Editor */}
          <div>
            <p className="text-sm text-theme-muted mb-4">
              Paste source code with doc comments. TomeBase extracts types, signatures, and descriptions.
            </p>
            <ImportForm projectId={projectId} />
          </div>

          {/* Right: Preview */}
          <div className="rounded-xl border border-theme-border bg-theme-card p-5">
            <h3 className="text-sm font-semibold text-theme-main mb-3">What gets generated</h3>
            <div className="space-y-3">
              <div className="rounded-lg bg-theme-page border border-theme-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-theme-accent" />
                  <span className="text-xs font-medium text-theme-main">Function pages</span>
                </div>
                <p className="text-xs text-theme-muted">Each exported function becomes a documentation page with parameters, return types, and usage examples.</p>
              </div>
              <div className="rounded-lg bg-theme-page border border-theme-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-medium text-theme-main">Type pages</span>
                </div>
                <p className="text-xs text-theme-muted">Interfaces, types, and enums become reference pages with field descriptions.</p>
              </div>
              <div className="rounded-lg bg-theme-page border border-theme-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-theme-main">Wiki links</span>
                </div>
                <p className="text-xs text-theme-muted">Cross-references between types are automatically linked with [[wiki links]].</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-theme-muted mb-6">
            Import an OpenAPI 3.0/3.1 specification to generate API endpoint documentation pages. Supports JSON and YAML
            formats — paste directly or fetch from a URL.
          </p>
          <OpenApiForm projectId={projectId} />
        </div>
      )}
    </div>
  );
}
