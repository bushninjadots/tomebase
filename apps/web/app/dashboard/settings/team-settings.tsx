'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Badge } from '@fluid/ui';
import { Copy, Check, Users, Link2, RefreshCw } from 'lucide-react';

interface TeamMember {
  user: { id: string; name: string | null; email: string | null; image: string | null };
  role: string;
}

interface Team {
  id: string;
  name: string;
  personal: boolean;
  members: TeamMember[];
  _count: { projects: number };
}

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

  return (
    <div className="space-y-8">
      {!team.personal && (
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Team Name</h2>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
            />
            {isAdmin && (
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Members</h2>
        <p className="mt-1 text-sm text-gray-500">
          {team.members.length} member{team.members.length !== 1 ? 's' : ''}
        </p>
        <div className="mt-4 space-y-2">
          {team.members.map((member) => (
            <div
              key={member.user.id}
              className="flex items-center gap-3 rounded-lg border border-gray-50 bg-gray-50/50 px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fluid-100 text-sm font-medium text-fluid-700">
                {member.user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {member.user.name ?? 'Unknown'}
                  {member.user.id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </div>
                {member.user.email && (
                  <div className="text-xs text-gray-500">{member.user.email}</div>
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
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Invite Members</h2>
          <p className="mt-1 text-sm text-gray-500">
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
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 font-mono text-sm text-gray-700 break-all">
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

      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
        <p className="mt-1 text-sm text-gray-500">
          {team._count.projects} project{team._count.projects !== 1 ? 's' : ''} in this team.
          All team members can view and edit team projects.
        </p>
      </div>
    </div>
  );
}
