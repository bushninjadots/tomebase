'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@fluid/ui';
import { Globe, Check, Copy } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  published: boolean;
  customDomain: string | null;
  logoUrl: string | null;
  _count: { pages: number };
}

export function ProjectSettingsForm({ project }: { project: Project }) {
  const router = useRouter();
  const [published, setPublished] = useState(project.published);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [customDomain, setCustomDomain] = useState(project.customDomain ?? '');
  const [logoUrl, setLogoUrl] = useState(project.logoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/p/${project.id}`;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, published, customDomain, logoUrl }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }

    setSaving(false);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">General</h2>
        <div className="mt-4 space-y-4">
          <Input
            id="name"
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
            />
          </div>
          <Input
            id="logoUrl"
            label="Logo URL (for exported docs)"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://yourdomain.com/logo.png"
          />
          <p className="text-xs text-gray-400 -mt-3">
            Used as branding in exported Markdown files.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Publish</h2>
            <p className="mt-1 text-sm text-gray-500">
              Make your documentation accessible to anyone with the link.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-fluid-600 peer-checked:after:translate-x-full" />
          </label>
        </div>

        {published && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Your docs are live at:</span>
              <button
                type="button"
                onClick={copyUrl}
                className="ml-auto flex items-center gap-1 text-xs font-medium text-green-800 hover:text-green-900"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm text-gray-600 break-all">
              {publicUrl}
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Custom Domain</span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Pro</span>
              </div>
              <Input
                id="customDomain"
                label=""
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="docs.yourcompany.com"
              />
              {customDomain && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 space-y-2">
                  <p className="font-medium text-gray-700">DNS Setup Instructions</p>
                  <p>Add a CNAME record pointing your domain to:</p>
                  <code className="block rounded bg-white px-2 py-1 font-mono text-[11px] text-fluid-600 border border-gray-200">
                    {window.location.host}
                  </code>
                  <p className="text-gray-400">SSL certificates are provisioned automatically. Propagation may take up to 24 hours.</p>
                </div>
              )}
              <p className="mt-1.5 text-xs text-gray-400">
                Point your own domain to your published documentation site.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
