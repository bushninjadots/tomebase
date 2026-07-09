'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@fluid/ui';
import { Code2, ArrowRight, Check, AlertCircle } from 'lucide-react';

const sampleCode = `/**
 * Calculates the total price including tax and discounts.
 * @param {number} basePrice - The base price before adjustments
 * @param {number} taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @param {number} discount - Discount amount to subtract
 * @returns {number} The final price after all adjustments
 */
export function calculateTotal(basePrice: number, taxRate: number, discount: number = 0): number {
  const tax = basePrice * taxRate;
  return basePrice + tax - discount;
}

/**
 * Represents a user in the system.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
}

/**
 * Available subscription tiers.
 */
export enum SubscriptionTier {
  Free = 'free',
  Pro = 'pro',
  Enterprise = 'enterprise',
}

/**
 * Creates a new user with the given details.
 * @param {string} name - The user's display name
 * @param {string} email - The user's email address
 * @param {'admin' | 'user'} role - The user's role
 * @returns {User} The newly created user object
 */
export function createUser(name: string, email: string, role: 'admin' | 'user' = 'user'): User {
  return { id: crypto.randomUUID(), name, email, role, createdAt: new Date() };
}`;

interface ImportFormProps {
  projectId: string;
}

export function ImportForm({ projectId }: ImportFormProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    pages: Array<{ id: string; title: string; slug: string }>;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/codegen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'typescript', projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to generate docs');
        return;
      }

      setResult(data);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="code" className="text-sm font-medium text-gray-700">
            Source Code
          </label>
          <button
            type="button"
            onClick={() => setCode(sampleCode)}
            className="text-xs text-fluid-600 hover:text-fluid-700 transition-colors"
          >
            Load sample
          </button>
        </div>
        <textarea
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={18}
          className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed shadow-sm placeholder:text-gray-300 focus:border-fluid-500 focus:outline-none focus:ring-1 focus:ring-fluid-500"
          placeholder={`/**\n * Paste your TypeScript/JavaScript code here...\n */\nexport function myFunction() {\n  // ...\n}`}
          spellCheck={false}
        />
        <p className="text-xs text-gray-400">
          Supports TypeScript and JavaScript with JSDoc comments.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-green-800">
            <Check className="h-4 w-4" />
            {result.message}
          </div>
          {result.pages.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.pages.map((page) => (
                <li key={page.id}>
                  <a
                    href={`/docs/${projectId}/${page.slug}`}
                    className="text-sm text-green-700 hover:text-green-800 underline underline-offset-2"
                  >
                    {page.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {result.skipped > 0 && (
            <p className="mt-2 text-xs text-green-600">
              {result.skipped} page{result.skipped > 1 ? 's' : ''} skipped (already exist)
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading || !code.trim()} size="lg">
          {loading ? (
            'Generating...'
          ) : (
            <>
              <Code2 className="h-4 w-4" />
              Generate Documentation
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        {result && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/docs/${projectId}`)}
          >
            View Docs
          </Button>
        )}
      </div>
    </form>
  );
}
