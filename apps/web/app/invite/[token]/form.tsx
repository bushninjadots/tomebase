'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@fluid/ui';
import { Check } from 'lucide-react';

export function AcceptInviteForm({ token, userId }: { token: string; userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleAccept() {
    setLoading(true);

    const res = await fetch(`/api/invite/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 1000);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600">
        <Check className="h-5 w-5" />
        <span className="font-medium">Joined! Redirecting...</span>
      </div>
    );
  }

  return (
    <Button onClick={handleAccept} disabled={loading} size="lg">
      {loading ? 'Joining...' : 'Accept Invitation'}
    </Button>
  );
}
