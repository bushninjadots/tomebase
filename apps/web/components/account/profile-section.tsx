'use client';

import { useState, useCallback } from 'react';
import { User, Save, X } from 'lucide-react';
import { Spinner } from '@fluid/ui';

interface ProfileSectionProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date;
    hasPassword: boolean;
    connectedProviders: string[];
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [imageUrl, setImageUrl] = useState(user.image ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges = name !== (user.name ?? '') || email !== (user.email ?? '') || imageUrl !== (user.image ?? '');

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, image: imageUrl || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to update profile');
        return;
      }

      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, email, imageUrl, hasChanges]);

  const handleCancel = useCallback(() => {
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setImageUrl(user.image ?? '');
    setEditing(false);
    setError(null);
  }, [user.name, user.email, user.image]);

  const authMethod = user.connectedProviders.length > 0
    ? user.connectedProviders.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')
    : user.hasPassword
      ? 'Email & Password'
      : 'Unknown';

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-theme-muted" />
          <h2 className="text-sm font-semibold text-theme-main">Profile</h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#E5A50B] to-[#ca8a04] flex items-center justify-center text-lg font-bold text-gray-900 shrink-0">
          {(editing ? imageUrl : user.image) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={editing ? imageUrl : user.image!} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
          )}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="profile-name" className="block text-xs font-medium text-theme-muted mb-1">Display Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="block text-xs font-medium text-theme-muted mb-1">Email</label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="profile-image" className="block text-xs font-medium text-theme-muted mb-1">Profile Picture URL</label>
                <input
                  id="profile-image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-40"
                >
                  {saving ? <Spinner size="sm" /> : <Save className="h-3 w-3" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border px-3 py-1.5 text-xs font-medium text-theme-muted hover:bg-theme-hover transition-colors"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-theme-main">{user.name || 'Unnamed User'}</p>
              <p className="text-xs text-theme-muted">{user.email}</p>
              <p className="text-xs text-theme-muted">Member since {user.createdAt.toLocaleDateString()}</p>
              <p className="text-xs text-theme-muted">Auth: {authMethod}</p>
              {success && <p className="text-xs text-green-400">Profile updated.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
