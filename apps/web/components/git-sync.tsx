'use client';

import { useState, useEffect } from 'react';
import { Github, RefreshCw, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Input } from '@fluid/ui';

interface GitSyncProps {
  projectId: string;
}

const STORAGE_KEY = (id: string) => `git-sync-${id}`;

export function GitSync({ projectId }: GitSyncProps) {
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [docsPath, setDocsPath] = useState('/');
  const [token, setToken] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY(projectId));
      if (saved) {
        const cfg = JSON.parse(saved);
        setRepo(cfg.repo ?? '');
        setBranch(cfg.branch ?? 'main');
        setDocsPath(cfg.path ?? '/');
      }
    } catch { /* ignore */ }
  }, [projectId]);

  function saveToLocal() {
    try {
      localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify({ repo, branch, path: docsPath }));
    } catch { /* ignore */ }
  }

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    saveToLocal();
    try {
      const body: Record<string, string> = { repo, branch, path: docsPath };
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

  const hasConfig = !!repo;

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
        <button
          onClick={handleSync}
          disabled={syncing || !repo}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {result && (
        <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
          result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.ok ? <Check className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      {hasConfig && (
        <a
          href={`https://github.com/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {repo}
        </a>
      )}
    </div>
  );
}
