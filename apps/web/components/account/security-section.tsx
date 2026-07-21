'use client';

import { useState, useCallback, useEffect } from 'react';
import { Shield, Lock, Check, Monitor, Trash2, QrCode, Copy } from 'lucide-react';
import { Spinner } from '@fluid/ui';

interface SecuritySectionProps {
  hasPassword: boolean;
  connectedProviders: string[];
  hasOAuth: boolean;
  twoFactorEnabled: boolean;
}

interface Session {
  id: string;
  expires: string;
  isCurrent: boolean;
}

export function SecuritySection({ hasPassword, connectedProviders, hasOAuth, twoFactorEnabled }: SecuritySectionProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(twoFactorEnabled);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [twoFASecret, setTwoFASecret] = useState<string | null>(null);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/account/sessions')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSessions(data);
      })
      .catch(() => {
        // Sessions load is best-effort; empty list will be shown
      })
      .finally(() => setSessionsLoading(false));
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    if (!confirm('Revoke this session? The device will be signed out.')) return;

    try {
      const res = await fetch('/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // ignore
    }
  }, []);

  const start2FASetup = useCallback(async () => {
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const res = await fetch('/api/account/2fa');
      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.qrCodeUrl);
        setTwoFASecret(data.secret);
        setShow2FASetup(true);
      }
    } catch {
      setTwoFAError('Failed to start 2FA setup');
    } finally {
      setTwoFALoading(false);
    }
  }, []);

  const verify2FA = useCallback(async () => {
    if (!twoFASecret || !twoFAToken) return;
    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      const res = await fetch('/api/account/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: twoFASecret, token: twoFAToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        setTwoFAError(data.error || 'Invalid code');
        return;
      }

      setTwoFAEnabled(true);
      setShow2FASetup(false);
      setQrCodeUrl(null);
      setTwoFASecret(null);
      setTwoFAToken('');
    } catch {
      setTwoFAError('Something went wrong');
    } finally {
      setTwoFALoading(false);
    }
  }, [twoFASecret, twoFAToken]);

  const disable2FA = useCallback(async () => {
    if (!confirm('Disable two-factor authentication? Your account will be less secure.')) return;

    try {
      const res = await fetch('/api/account/2fa', { method: 'DELETE' });
      if (res.ok) {
        setTwoFAEnabled(false);
      }
    } catch {
      // ignore
    }
  }, []);

  const copySecret = useCallback(() => {
    if (twoFASecret) {
      navigator.clipboard.writeText(twoFASecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }, [twoFASecret]);

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
                  {saving ? <Spinner size="sm" /> : <Lock className="h-3 w-3" />}
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
              <p className="text-xs text-theme-muted mt-0.5">
                {twoFAEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
            {twoFAEnabled ? (
              <button
                onClick={disable2FA}
                className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={start2FASetup}
                disabled={twoFALoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-40"
              >
                {twoFALoading ? <Spinner size="sm" /> : <QrCode className="h-3 w-3" />}
                {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
              </button>
            )}
          </div>

          {twoFAEnabled && !show2FASetup && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
              <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
              <p className="text-xs text-green-400">Two-factor authentication is enabled</p>
            </div>
          )}

          {show2FASetup && qrCodeUrl && (
            <div className="mt-4 rounded-xl border border-theme-border bg-theme-page p-4 space-y-4">
              <div className="text-center">
                <p className="text-xs text-theme-muted mb-3">
                  Scan this QR code with your authenticator app
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto rounded-lg" width={200} height={200} loading="lazy" />
              </div>

              <div>
                <p className="text-[11px] text-theme-muted mb-1">Or enter this secret manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-theme-card border border-theme-border px-3 py-2 text-xs font-mono text-theme-main break-all">
                    {twoFASecret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="shrink-0 rounded-lg border border-theme-border bg-theme-hover px-2 py-2 text-theme-subtle hover:text-theme-main transition-colors"
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="2fa-token" className="block text-xs font-medium text-theme-muted mb-1">
                  Enter the 6-digit code from your app
                </label>
                <input
                  id="2fa-token"
                  type="text"
                  value={twoFAToken}
                  onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-sm text-theme-main font-mono text-center tracking-widest placeholder:text-theme-muted focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              {twoFAError && <p className="text-xs text-red-400">{twoFAError}</p>}

              <div className="flex items-center gap-2">
                <button
                  onClick={verify2FA}
                  disabled={twoFALoading || twoFAToken.length !== 6}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-theme-accent-hover transition-colors disabled:opacity-40"
                >
                  {twoFALoading ? <Spinner size="sm" /> : <Check className="h-3 w-3" />}
                  {twoFALoading ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button
                  onClick={() => { setShow2FASetup(false); setQrCodeUrl(null); setTwoFASecret(null); setTwoFAToken(''); }}
                  disabled={twoFALoading}
                  className="text-xs text-theme-muted hover:text-theme-main transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="pt-4 border-t border-theme-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-theme-main">Active Sessions</p>
              <p className="text-xs text-theme-muted mt-0.5">Manage your active login sessions</p>
            </div>
          </div>

          {sessionsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size="md" className="text-theme-muted" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-theme-muted py-2">No active sessions found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => {
                const expiryDate = new Date(s.expires);
                const isExpired = expiryDate < new Date();
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-theme-border bg-theme-page px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Monitor className="h-4 w-4 text-theme-muted shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-theme-main">Session</p>
                          {s.isCurrent && (
                            <span className="shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-medium text-green-400">
                              Current
                            </span>
                          )}
                          {isExpired && (
                            <span className="shrink-0 rounded-full bg-theme-hover px-1.5 py-0.5 text-[9px] font-medium text-theme-muted">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-theme-muted">
                          Expires {expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {!s.isCurrent && !isExpired && (
                      <button
                        onClick={() => revokeSession(s.id)}
                        className="shrink-0 ml-2 p-1 rounded text-theme-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        aria-label="Revoke session"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
