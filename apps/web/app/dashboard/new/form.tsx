'use client';

import { useRouter } from 'next/navigation';
import { Input, Button } from '@fluid/ui';
import { useState } from 'react';
import { FileText, Code2, Users, BookOpen } from 'lucide-react';
import { templateService, type ProjectTemplate } from '@/lib/templates';

const iconMap: Record<string, React.ElementType> = {
  FileText, Code2, Users, BookOpen,
};

export function CreateProjectForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const description = form.get('description') as string;

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, templateId: selectedTemplate, userId }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Something went wrong');
      setLoading(false);
      return;
    }

    const project = await res.json();
    router.push(`/docs/${project.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="name"
        name="name"
        label="Project Name"
        placeholder="e.g., API Documentation"
        required
      />
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-theme-subtle">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="block w-full rounded-lg border border-theme-border px-3 py-2 text-sm shadow-sm placeholder:text-theme-muted focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
          placeholder="What is this project about?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-subtle mb-3">
          Project Template
        </label>
        <div className="grid gap-3">
          {templateService.getAllProjectTemplates().map((tpl) => {
            const Icon = iconMap[tpl.icon] || FileText;
            const isSelected = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-fluid-500 bg-fluid-50 ring-1 ring-fluid-500'
                    : 'border-theme-border bg-theme-card hover:border-theme-muted'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-theme-accent text-gray-900' : 'bg-theme-hover text-theme-muted'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-fluid-700' : 'text-theme-main'}`}>
                    {tpl.name}
                  </p>
                  <p className="mt-0.5 text-xs text-theme-muted">{tpl.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  );
}
