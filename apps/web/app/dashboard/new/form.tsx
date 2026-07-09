'use client';

import { useRouter } from 'next/navigation';
import { Input, Button } from '@fluid/ui';
import { useState } from 'react';

export function CreateProjectForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      body: JSON.stringify({ name, description, userId }),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        name="name"
        label="Project Name"
        placeholder="e.g., API Documentation"
        required
      />
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
          placeholder="What is this project about?"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  );
}
