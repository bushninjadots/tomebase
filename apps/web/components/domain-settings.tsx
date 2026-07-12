'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '@fluid/ui';
import { Globe, Check, Copy, RefreshCw, Trash2, Shield, AlertTriangle, Clock } from 'lucide-react';

interface DomainStatus {
  domain: string | null;
  configured: boolean;
  verified: boolean;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  sslStatus: string | null;
  nameservers: string[];
  cnames: string[];
  vercelAvailable: boolean;
}

interface DomainSettingsProps {
  projectId: string;
  customDomain: string | null;
  published: boolean;
}

export function DomainSettings({ projectId, customDomain: initialDomain, published }: DomainSettingsProps) {
  const [domain, setDomain] = useState(initialDomain ?? '');
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/domain`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Ignore fetch errors
    }
  }, [projectId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleSave() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customDomain: domain || '' }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await fetchStatus();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save domain');
    }

    setLoading(false);
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/domain/verify`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        await fetchStatus();
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch {
      setError('Network error during verification');
    }

    setVerifying(false);
  }

  async function handleRemove() {
    if (!confirm('Remove this custom domain?')) return;
    setRemoving(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/domain/remove`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDomain('');
        setStatus(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove domain');
      }
    } catch {
      setError('Network error removing domain');
    }

    setRemoving(false);
  }

  async function copyHostname() {
    if (!status?.domain) return;
    await navigator.clipboard.writeText(status.domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!published) {
    return (
      <div className="rounded-xl border border-theme-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4 text-theme-muted" />
          <span className="text-sm font-medium text-theme-subtle">Custom Domain</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Pro</span>
        </div>
        <p className="text-xs text-theme-muted">
          Publish your project first, then configure a custom domain.
        </p>
      </div>
    );
  }

  const isVerified = status?.verified;
  const hasDomain = !!status?.domain;

  return (
    <div className="rounded-xl border border-theme-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-theme-muted" />
        <span className="text-sm font-medium text-theme-subtle">Custom Domain</span>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Pro</span>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {hasDomain && status && (
        <div className="mb-3 space-y-2">
          {/* Domain + status */}
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-theme-card px-3 py-2 font-mono text-sm text-theme-subtle border border-theme-border">
              {status.domain}
            </code>
            <button
              type="button"
              onClick={copyHostname}
              className="shrink-0 rounded-lg border border-theme-border p-2 text-theme-muted hover:bg-theme-hover transition-colors"
              title="Copy domain"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Verification status */}
          <div className="flex items-center gap-4 text-xs">
            {isVerified ? (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-3.5 w-3.5" />
                DNS verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3.5 w-3.5" />
                Pending verification
              </span>
            )}
            {status.sslStatus === 'active' ? (
              <span className="flex items-center gap-1 text-green-600">
                <Shield className="h-3.5 w-3.5" />
                SSL active
              </span>
            ) : status.sslStatus === 'failed' ? (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                SSL failed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                SSL provisioning
              </span>
            )}
            {status.lastCheckedAt && (
              <span className="text-theme-muted">
                Checked {new Date(status.lastCheckedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* DNS instructions (only if not verified) */}
          {!isVerified && (
            <div className="rounded-lg bg-theme-card p-3 text-xs text-theme-subtle space-y-2 border border-theme-border">
              <p className="font-medium text-theme-subtle">DNS Setup Instructions</p>
              <p>Add a <strong>CNAME</strong> record pointing your domain to:</p>
              <code className="block rounded bg-theme-page px-2 py-1 font-mono text-[11px] text-theme-accent border border-theme-border">
                cname.vercel-dns.com
              </code>
              {status.vercelAvailable ? (
                <p className="text-theme-muted">Vercel will verify DNS and provision SSL automatically.</p>
              ) : (
                <p className="text-theme-muted">
                  Set <code>VERCEL_TOKEN</code> and <code>VERCEL_PROJECT_ID</code> for automatic verification.
                </p>
              )}
              <p className="text-theme-muted">Propagation may take up to 48 hours.</p>
            </div>
          )}
        </div>
      )}

      {/* Input + actions */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            id="customDomain"
            label=""
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="docs.yourcompany.com"
          />
        </div>
        {!hasDomain ? (
          <Button type="button" onClick={handleSave} disabled={loading || !domain.trim()}>
            {loading ? 'Saving...' : 'Add Domain'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleVerify}
              disabled={verifying || isVerified}
              variant="secondary"
            >
              {verifying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isVerified ? 'Verified' : 'Verify'}
            </Button>
            <Button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              variant="secondary"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {saved && (
        <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
          <Check className="h-4 w-4" /> Domain saved
        </p>
      )}

      {!hasDomain && (
        <p className="mt-1.5 text-xs text-theme-muted">
          Point your own domain to your published documentation site.
        </p>
      )}
    </div>
  );
}
