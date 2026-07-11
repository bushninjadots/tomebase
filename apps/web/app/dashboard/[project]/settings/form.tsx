'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@fluid/ui';
import { Globe, Check, Copy } from 'lucide-react';
import { DomainSettings } from '@/components/domain-settings';

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
      body: JSON.stringify({ name, description, published, logoUrl }),
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
      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <h2 className="text-lg font-semibold text-theme-main">General</h2>
        <div className="mt-4 space-y-4">
          <Input
            id="name"
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-theme-subtle">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="block w-full rounded-xl border border-theme-border bg-theme-page px-3 py-2 text-sm text-theme-main shadow-sm placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
            />
          </div>
          <Input
            id="logoUrl"
            label="Logo URL (for exported docs)"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://yourdomain.com/logo.png"
          />
          <p className="text-xs text-theme-muted -mt-3">
            Used as branding in exported Markdown files.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-theme-main">Publish</h2>
            <p className="mt-1 text-sm text-theme-subtle">
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
            <div className="h-6 w-11 rounded-full bg-theme-hover after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-theme-accent peer-checked:after:translate-x-full" />
          </label>
        </div>

        {published && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Your docs are live at:</span>
              <button
                type="button"
                onClick={copyUrl}
                className="ml-auto flex items-center gap-1 text-xs font-medium text-green-400 hover:text-green-300"
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
            <div className="rounded-xl border border-theme-border bg-theme-page px-3 py-2 font-mono text-sm text-theme-subtle break-all">
              {publicUrl}
            </div>

            <DomainSettings
              projectId={project.id}
              customDomain={project.customDomain}
              published={published}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-400">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
