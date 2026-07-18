import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AIProviderSettings } from '@/components/account/ai-provider-settings';

export const metadata: Metadata = {
  title: 'AI Settings — TomeBase',
  description: 'Configure your AI providers and API keys.',
};

export default async function AIProviderSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="min-h-screen bg-theme-page">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/dashboard/account"
          className="mb-6 inline-flex items-center gap-1 text-sm text-theme-muted hover:text-theme-main transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Account
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-theme-main tracking-tight">AI Providers</h1>
          <p className="mt-1.5 text-sm text-theme-muted">
            Bring your own API key. Connect to OpenAI, Anthropic, Gemini, or run models locally.
          </p>
        </div>

        <AIProviderSettings />
      </div>
    </div>
  );
}
