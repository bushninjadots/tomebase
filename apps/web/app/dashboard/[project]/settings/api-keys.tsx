'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key?: string;
  createdAt: string;
  expiresAt: string | null;
}

export function ApiKeyManager({ projectId }: { projectId: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newExpiry, setNewExpiry] = useState('30');
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    const res = await fetch(`/api/projects/${projectId}/keys`);
    if (res.ok) {
      setKeys(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadKeys();
  }, [projectId]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/projects/${projectId}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName,
        expiresInDays: newExpiry ? parseInt(newExpiry) : null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKeyValue(data.key);
      setKeys((prev) => [data, ...prev]);
      setNewName('');
      setShowNew(false);
    }
    setCreating(false);
  }

  async function deleteKey(keyId: string) {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return;
    const res = await fetch(`/api/projects/${projectId}/keys/${keyId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    }
  }

  async function copyKey(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          <p className="mt-1 text-sm text-gray-500">
            Keys allow programmatic access to your documentation.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Key
        </button>
      </div>

      {newKeyValue && (
        <div className="mb-4 rounded-lg border border-fluid-200 bg-fluid-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-fluid-800">Key created</span>
            <button
              onClick={() => setNewKeyValue(null)}
              className="text-sm text-fluid-600 hover:text-fluid-800"
            >
              Dismiss
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-mono text-sm text-gray-900 border border-fluid-200">
            <code className="flex-1 break-all">{newKeyValue}</code>
            <button
              onClick={() => copyKey(newKeyValue)}
              className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-fluid-600">
            Copy this key now — you won&apos;t be able to see it again.
          </p>
        </div>
      )}

      {showNew && (
        <form onSubmit={createKey} className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Key name (e.g. CI/CD)"
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
            autoFocus
          />
          <select
            value={newExpiry}
            onChange={(e) => setNewExpiry(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
          >
            <option value="">No expiry</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="py-8 text-center">
          <Key className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No API keys yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{apiKey.name}</p>
                <p className="text-xs text-gray-400">
                  Created {new Date(apiKey.createdAt).toLocaleDateString()}
                  {apiKey.expiresAt && ` · Expires ${new Date(apiKey.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => deleteKey(apiKey.id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Revoke key"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
