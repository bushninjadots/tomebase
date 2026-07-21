'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, FileText, Shield, Calendar, Check } from 'lucide-react';
import { Spinner } from '@fluid/ui';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: typeof Mail;
  defaultEnabled: boolean;
}

const PREFERENCES: NotificationPreference[] = [
  { id: 'product_updates', label: 'Product Updates', description: 'New features and improvements', icon: Bell, defaultEnabled: true },
  { id: 'team_invitations', label: 'Team Invitations', description: 'When someone invites you to a team', icon: Mail, defaultEnabled: true },
  { id: 'health_reports', label: 'Documentation Health Reports', description: 'Weekly documentation quality summaries', icon: FileText, defaultEnabled: true },
  { id: 'security_alerts', label: 'Security Alerts', description: 'Important security notifications', icon: Shield, defaultEnabled: true },
  { id: 'weekly_summary', label: 'Weekly Summary', description: 'Activity digest and recommendations', icon: Calendar, defaultEnabled: false },
];

export function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PREFERENCES.map((p) => [p.id, p.defaultEnabled]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/account/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setPrefs((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        // Notifications load is best-effort; default prefs will be used
      });
  }, []);

  const save = useCallback(async (newPrefs: Record<string, boolean>) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/account/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, []);

  const toggle = (id: string) => {
    const newPrefs = { ...prefs, [id]: !prefs[id] };
    setPrefs(newPrefs);
    save(newPrefs);
  };

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-theme-muted" />
          <h2 className="text-sm font-semibold text-theme-main">Notifications</h2>
        </div>
        {saving && <Spinner size="sm" className="text-theme-muted" />}
        {saved && (
          <div className="flex items-center gap-1 text-green-400">
            <Check className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Saved</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {PREFERENCES.map((pref) => {
          const Icon = pref.icon;
          const enabled = prefs[pref.id];
          const isSecurity = pref.id === 'security_alerts';

          return (
            <div key={pref.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-theme-muted shrink-0" />
                <div>
                  <p className="text-sm text-theme-main">{pref.label}</p>
                  <p className="text-[11px] text-theme-muted">{pref.description}</p>
                </div>
              </div>
              <button
                onClick={() => !isSecurity && toggle(pref.id)}
                disabled={isSecurity}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  enabled ? 'bg-theme-accent' : 'bg-theme-hover border border-theme-border'
                } ${isSecurity ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={`Toggle ${pref.label}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-theme-border">
        <p className="text-[11px] text-theme-muted">
          Security alerts are always enabled for your protection.
        </p>
      </div>
    </div>
  );
}
