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
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 mb-8">
        <button
          onClick={() => setTab('code')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'code'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Code2 className="inline h-4 w-4 mr-1.5" />
          From Code
        </button>
        <button
          onClick={() => setTab('openapi')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'openapi'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileJson className="inline h-4 w-4 mr-1.5" />
          OpenAPI Spec
        </button>
      </div>

      {tab === 'code' ? (
        <div>
          <p className="text-sm text-gray-500 mb-6">
            Paste your TypeScript or JavaScript source code. TomeBase parses JSDoc comments, types, and signatures to
            generate documentation pages.
          </p>
          <ImportForm projectId={projectId} />
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-6">
            Import an OpenAPI 3.0/3.1 specification to generate API endpoint documentation pages. Supports JSON and YAML
            formats — paste directly or fetch from a URL.
          </p>
          <OpenApiForm projectId={projectId} />
        </div>
      )}
    </div>
  );
}
