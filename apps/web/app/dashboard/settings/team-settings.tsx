'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Badge } from '@fluid/ui';
import { Copy, Check, Users, Link2, RefreshCw, CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface TeamMember {
  user: { id: string; name: string | null; email: string | null; image: string | null };
  role: string;
}

interface Team {
  id: string;
  name: string;
  personal: boolean;
  tier: string;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  members: TeamMember[];
  _count: { projects: number };
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
};

export function TeamSettings({
  team,
  currentUserId,
  currentUserRole,
}: {
  team: Team;
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const isAdmin = currentUserRole === 'admin';
  const [name, setName] = useState(team.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: team.id, name, userId: currentUserId }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
    setSaving(false);
  }

  async function createInviteLink() {
    if (!isAdmin) return;
    setCreatingLink(true);

    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: team.id, userId: currentUserId }),
    });

    const data = await res.json();
    if (data.url) {
      setInviteUrl(data.url);
    }
    setCreatingLink(false);
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    }
    setPortalLoading(false);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <h2 className="text-lg font-semibold text-theme-main flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-theme-muted" />
          Billing
        </h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-theme-main">
              Current Plan: <Badge variant={team.tier === 'free' ? 'warning' : 'success'}>{TIER_LABELS[team.tier] || team.tier}</Badge>
            </div>
            {team.stripeSubscriptionId && team.currentPeriodEnd && (
              <p className="mt-1 text-xs text-theme-muted">
                Renews {new Date(team.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {team.tier === 'free' ? (
              <Link
                href="/pricing"
                className="btn-primary text-sm"
              >
                Upgrade
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleManageBilling}
                disabled={portalLoading}
              >
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {!team.personal && (
        <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
          <h2 className="text-lg font-semibold text-theme-main">Team Name</h2>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
            />
            {isAdmin && (
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-green-400">
                    <Check className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <h2 className="text-lg font-semibold text-theme-main">Members</h2>
        <p className="mt-1 text-sm text-theme-subtle">
          {team.members.length} member{team.members.length !== 1 ? 's' : ''}
        </p>
        <div className="mt-4 space-y-2">
          {team.members.map((member) => (
            <div
              key={member.user.id}
              className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-page px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-accent-light text-sm font-medium text-theme-accent">
                {member.user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-theme-main">
                  {member.user.name ?? 'Unknown'}
                  {member.user.id === currentUserId && (
                    <span className="ml-2 text-xs text-theme-muted">(you)</span>
                  )}
                </div>
                {member.user.email && (
                  <div className="text-xs text-theme-muted">{member.user.email}</div>
                )}
              </div>
              <Badge variant={member.role === 'admin' ? 'default' : 'success'}>
                {member.role}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
          <h2 className="text-lg font-semibold text-theme-main">Invite Members</h2>
          <p className="mt-1 text-sm text-theme-subtle">
            Create an invite link to share with your team. Links expire after 7 days. Your current plan supports up to {team._count.projects > 0 ? 'a certain number of' : '3'} members — the invite will be rejected if the limit is reached.
          </p>
          <div className="mt-4">
            {!inviteUrl ? (
              <Button
                type="button"
                variant="outline"
                onClick={createInviteLink}
                disabled={creatingLink}
              >
                {creatingLink ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Generate Invite Link
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-page px-4 py-3 font-mono text-sm text-theme-subtle break-all">
                  {inviteUrl}
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={copyLink} variant="secondary">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy Link
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setInviteUrl(null)}
                  >
                    Generate New
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
        <h2 className="text-lg font-semibold text-theme-main">Projects</h2>
        <p className="mt-1 text-sm text-theme-subtle">
          {team._count.projects} project{team._count.projects !== 1 ? 's' : ''} in this team.
          All team members can view and edit team projects.
        </p>
      </div>
    </div>
  );
}
