'use client';

import { useState } from 'react';
import { Bell, Mail, FileText, Shield, AlertTriangle, Calendar } from 'lucide-react';

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

  const toggle = (id: string) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-theme-muted" />
          <h2 className="text-sm font-semibold text-theme-main">Notifications</h2>
        </div>
        <span className="text-[10px] text-theme-muted bg-theme-hover px-2 py-0.5 rounded-full border border-theme-border">
          Coming Soon
        </span>
      </div>

      <div className="space-y-1 opacity-60 pointer-events-none">
        {PREFERENCES.map((pref) => {
          const Icon = pref.icon;
          const enabled = prefs[pref.id];

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
                onClick={() => toggle(pref.id)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  enabled ? 'bg-theme-accent' : 'bg-theme-hover border border-theme-border'
                }`}
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
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-theme-muted mt-0.5 shrink-0" />
          <p className="text-[11px] text-theme-muted">
            Notification preferences will be saved once backend support is implemented. Security alerts are always enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
