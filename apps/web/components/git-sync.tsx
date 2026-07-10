'use client';

import { useState } from 'react';
import { Github, RefreshCw, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Input, Button } from '@fluid/ui';

interface GitSyncProps {
  projectId: string;
  initialRepo: string | null;
  initialBranch: string | null;
  initialPath: string | null;
}

export function GitSync({ projectId, initialRepo, initialBranch, initialPath }: GitSyncProps) {
  const [repo, setRepo] = useState(initialRepo || '');
  const [branch, setBranch] = useState(initialBranch || 'main');
  const [docsPath, setDocsPath] = useState(initialPath || '/');
  const [token, setToken] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubRepo: repo, githubBranch: branch, githubDocsPath: docsPath }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json();
        setResult({ ok: false, message: data.error || 'Failed to save' });
      }
    } catch {
      setResult({ ok: false, message: 'Failed to save settings' });
    }
    setSaving(false);
  }

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const body: Record<string, string> = {};
      if (token) body.token = token;

      const res = await fetch(`/api/projects/${projectId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({
          ok: true,
          message: `Synced ${data.total} pages (${data.created} created, ${data.updated} updated)`,
        });
      } else {
        setResult({ ok: false, message: data.error || 'Sync failed' });
      }
    } catch {
      setResult({ ok: false, message: 'Sync request failed' });
    }
    setSyncing(false);
  }

  const hasConfig = !!initialRepo;
  const repoShort = initialRepo?.includes('/') ? initialRepo : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Github className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">GitHub Sync</h3>
        {hasConfig && (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
            Connected
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">
        Sync Markdown files from a GitHub repository into this project.
      </p>

      <div className="space-y-3">
        <Input
          id="githubRepo"
          label="Repository"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repo"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="githubBranch"
            label="Branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
          />
          <Input
            id="githubDocsPath"
            label="Docs Path"
            value={docsPath}
            onChange={(e) => setDocsPath(e.target.value)}
            placeholder="/docs"
          />
        </div>
        <Input
          id="githubToken"
          label="Access Token (optional, for private repos)"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Config'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        {hasConfig && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      {result && (
        <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
          result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.ok ? <Check className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      {repoShort && (
        <a
          href={`https://github.com/${initialRepo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {initialRepo}
        </a>
      )}
    </div>
  );
}
