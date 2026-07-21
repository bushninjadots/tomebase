'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@fluid/ui';
import { Globe, Check, Copy } from 'lucide-react';
import { DomainSettings } from '@/components/domain-settings';
import type { ProjectWithCount } from '@fluid/types';

export function ProjectSettingsForm({ project }: { project: ProjectWithCount }) {
  const router = useRouter();

  const [published, setPublished] = useState(project.published);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [logoUrl, setLogoUrl] = useState(project.logoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';

    return base
      ? `${base}/p/${project.id}`
      : `/p/${project.id}`;
  }, [project.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          published,
          logoUrl,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save project');
      }

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function copyUrl() {
    try {
      if (!navigator.clipboard) return;

      await navigator.clipboard.writeText(publicUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL', err);
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <h3 className="text-sm font-semibold text-theme-main mb-4">Project Details</h3>

      <div className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Documentation"
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-theme-main">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-sm text-theme-main outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent"
            rows={3}
            placeholder="A short description of your project"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-theme-main">Logo URL</label>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-theme-border p-4">
          <div>
            <p className="text-sm font-medium text-theme-main">Published</p>
            <p className="text-xs text-theme-muted">Make documentation publicly accessible</p>
          </div>
          <button
            type="button"
            onClick={() => setPublished(!published)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              published ? 'bg-theme-accent' : 'bg-theme-hover'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                published ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {published && (
          <div className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-hover p-3">
            <Globe className="h-4 w-4 text-theme-muted shrink-0" />
            <span className="text-xs text-theme-subtle truncate flex-1">{publicUrl}</span>
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 rounded p-1 text-theme-muted hover:bg-theme-card hover:text-theme-subtle transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="mt-8">
        <DomainSettings projectId={project.id} customDomain={project.customDomain} published={published} />
      </div>
    </form>
  );
}
