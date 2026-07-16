'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react';

interface Token {
  id: string;
  name: string;
  prefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  rawToken?: string;
}

export function ApiAccessSection() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/account/tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/account/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, expiresInDays: expiresInDays || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create token');
        return;
      }

      const token = await res.json();
      setNewToken(token.rawToken);
      setTokens((prev) => [{ ...token, rawToken: undefined }, ...prev]);
      setName('');
      setExpiresInDays('');
      setShowForm(false);
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Revoke this token? It will stop working immediately.')) return;

    try {
      const res = await fetch(`/api/account/tokens/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // ignore
    }
  }

  function copyToken() {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-theme-muted" />
          <h2 className="text-sm font-semibold text-theme-main">API Access</h2>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-theme-accent px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-theme-accent-hover transition-colors"
          >
            <Plus className="h-3 w-3" /> New Token
          </button>
        )}
      </div>

      <p className="text-xs text-theme-muted mb-4">
        Personal access tokens allow programmatic access to the TomeBase API.
      </p>

      {/* New token alert */}
      {newToken && (
        <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-green-400">Token created</p>
            <button
              onClick={() => setNewToken(null)}
              className="text-theme-muted hover:text-theme-main text-xs"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[11px] text-theme-muted mb-2">
            Copy this token now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-theme-page border border-theme-border px-3 py-2 text-xs text-theme-main font-mono break-all">
              {newToken}
            </code>
            <button
              onClick={copyToken}
              className="shrink-0 rounded-lg border border-theme-border bg-theme-hover px-3 py-2 text-xs text-theme-subtle hover:text-theme-main transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 rounded-xl border border-theme-border bg-theme-page p-4 space-y-3">
          <div>
            <label htmlFor="token-name" className="block text-xs font-medium text-theme-muted mb-1">Name</label>
            <input
              id="token-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
              placeholder="e.g. CI/CD Pipeline"
              required
            />
          </div>
          <div>
            <label htmlFor="token-expiry" className="block text-xs font-medium text-theme-muted mb-1">Expires in (days, optional)</label>
            <input
              id="token-expiry"
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
              placeholder="Never"
              min="1"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
              {saving ? 'Creating...' : 'Create Token'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              disabled={saving}
              className="text-xs text-theme-muted hover:text-theme-main transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Token list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 text-theme-muted animate-spin" />
        </div>
      ) : tokens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-theme-border py-6 text-center">
          <Key className="h-6 w-6 text-theme-muted mx-auto mb-2" />
          <p className="text-xs text-theme-muted">No personal access tokens yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-page px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-theme-main">{token.name}</p>
                  <code className="text-[11px] text-theme-muted font-mono">{token.prefix}...</code>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-theme-muted">
                    Created {formatDate(token.createdAt)}
                  </span>
                  {token.expiresAt && (
                    <span className="text-[11px] text-theme-muted">
                      Expires {formatDate(token.expiresAt)}
                    </span>
                  )}
                  {token.lastUsedAt && (
                    <span className="text-[11px] text-theme-muted">
                      Last used {formatDate(token.lastUsedAt)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(token.id)}
                className="shrink-0 ml-3 p-1.5 rounded-lg text-theme-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                aria-label="Revoke token"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
