import { Container } from '@fluid/ui';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-white">
      <Container className="py-24">
        <div className="mx-auto max-w-lg text-center">
          <Sparkles className="mx-auto h-12 w-12 text-gray-200" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">TomeBase AI</h1>
          <p className="mt-3 text-gray-500">
            AI-powered answers over your documentation is on the roadmap.
            Check back soon.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </Container>
    </div>
  );
}
