'use client';

import { useState, useCallback } from 'react';
import { Shield, Lock, Loader2, Check, AlertTriangle, ExternalLink } from 'lucide-react';

interface SecuritySectionProps {
  hasPassword: boolean;
  connectedProviders: string[];
  hasOAuth: boolean;
}

export function SecuritySection({ hasPassword, connectedProviders, hasOAuth }: SecuritySectionProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to change password');
        return;
      }

      setSuccess(true);
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [currentPassword, newPassword]);

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="h-4 w-4 text-theme-muted" />
        <h2 className="text-sm font-semibold text-theme-main">Security</h2>
      </div>

      <div className="space-y-5">
        {/* Password Change */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-theme-muted" />
              <span className="text-sm text-theme-main">Password</span>
            </div>
            {hasPassword && !showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
              >
                Change
              </button>
            )}
          </div>

          {!hasPassword && !hasOAuth && (
            <p className="text-xs text-theme-muted">
              No password set. Your account uses a social login provider.
            </p>
          )}

          {!hasPassword && hasOAuth && (
            <p className="text-xs text-theme-muted">
              Your account is secured via {connectedProviders.join(' and ')}. Password management is not available for social logins.
            </p>
          )}

          {showPasswordForm && hasPassword && (
            <form onSubmit={handleChangePassword} className="space-y-3 mt-2">
              <div>
                <label htmlFor="current-password" className="block text-xs font-medium text-theme-muted mb-1">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  required
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-xs font-medium text-theme-muted mb-1">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-page px-3 py-2 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  minLength={8}
                  required
                />
                <p className="text-[11px] text-theme-muted mt-1">Minimum 8 characters</p>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving || !currentPassword || !newPassword}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPasswordForm(false); setError(null); }}
                  disabled={saving}
                  className="text-xs text-theme-muted hover:text-theme-main transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div className="pt-4 border-t border-theme-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-main">Two-Factor Authentication</p>
              <p className="text-xs text-theme-muted mt-0.5">Add an extra layer of security to your account</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-theme-hover px-2 py-1 text-[10px] font-medium text-theme-muted border border-theme-border">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="pt-4 border-t border-theme-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-main">Active Sessions</p>
              <p className="text-xs text-theme-muted mt-0.5">Manage your active login sessions</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-theme-hover px-2 py-1 text-[10px] font-medium text-theme-muted border border-theme-border">
              Coming Soon
            </span>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
            <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
            <p className="text-xs text-green-400">Password updated successfully.</p>
          </div>
        )}
      </div>
    </div>
  );
}
