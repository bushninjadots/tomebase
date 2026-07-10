'use client';

import { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, RefreshCw, ExternalLink, X, Check, AlertCircle } from 'lucide-react';

interface WebhookItem {
  id: string;
  url: string;
  events: string;
  active: boolean;
  secret: string;
  createdAt: string;
}

export function WebhookSettings({ projectId }: { projectId: string }) {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState('page.created,page.updated,page.published');
  const [saving, setSaving] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [projectId]);

  function load() {
    fetch(`/api/projects/${projectId}/webhooks`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWebhooks(data);
      })
      .catch(() => {});
  }

  async function create() {
    if (!url.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events }),
      });
      if (res.ok) {
        const webhook = await res.json();
        setWebhooks((prev) => [webhook, ...prev]);
        setUrl('');
        setShowForm(false);
      } else {
        setError('Failed to create webhook');
      }
    } catch {
      setError('Network error — could not create webhook');
    }
    setSaving(false);
  }

  async function toggleActive(id: string, active: boolean) {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      if (res.ok) {
        setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, active: !active } : w)));
      }
    } catch {
      setError('Failed to toggle webhook');
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/webhooks/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
      }
    } catch {
      setError('Failed to delete webhook');
    }
  }

  async function copySecret(secret: string) {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(secret);
    setTimeout(() => setCopiedSecret(null), 2000);
  }

  const allEvents = ['page.created', 'page.updated', 'page.published', 'page.deleted'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Webhooks</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors dark:bg-fluid-600 dark:hover:bg-fluid-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add webhook
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Events
              </label>
              <div className="flex flex-wrap gap-2">
                {allEvents.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <input
                      type="checkbox"
                      checked={events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEvents((prev) => prev ? `${prev},${event}` : event);
                        } else {
                          setEvents((prev) => prev.split(',').filter((ev) => ev !== event).join(','));
                        }
                      }}
                      className="rounded border-gray-300 text-fluid-600 focus:ring-fluid-500"
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-2 text-xs text-red-600">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={create}
                disabled={!url.trim() || saving}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 dark:bg-fluid-600 dark:hover:bg-fluid-700"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {webhooks.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          No webhooks configured. Add one to get notified of page events.
        </p>
      )}

      <div className="space-y-2">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    webhook.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {webhook.url}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {webhook.events}
                </span>
                <button
                  onClick={() => copySecret(webhook.secret)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Copy signing secret"
                >
                  {copiedSecret === webhook.secret ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <button
                onClick={() => toggleActive(webhook.id, webhook.active)}
                className={`rounded p-1.5 transition-colors ${
                  webhook.active
                    ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={webhook.active ? 'Disable' : 'Enable'}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => remove(webhook.id)}
                className="rounded p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
