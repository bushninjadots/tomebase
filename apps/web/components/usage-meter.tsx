import { TIERS } from '@/lib/limits';
import type { Tier } from '@/lib/limits';

interface UsageMeterProps {
  tier: Tier;
  projects: { current: number; limit: number };
  pages: { current: number; limit: number };
  members: { current: number; limit: number };
}

function Bar({
  label,
  current,
  limit,
  color,
}: {
  label: string;
  current: number;
  limit: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((current / limit) * 100));
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-theme-subtle">{label}</span>
        <span className={isAtLimit ? 'text-red-600 font-medium' : isNearLimit ? 'text-amber-600' : 'text-theme-subtle'}>
          {current}/{limit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-theme-hover overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsageMeter({ tier, projects, pages, members }: UsageMeterProps) {
  const tierConfig = TIERS[tier];
  const isEnterprise = tier === 'enterprise';

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-theme-main capitalize">{tier} plan</h3>
        {!isEnterprise && (
          <a
            href="/pricing"
            className="text-xs font-medium text-theme-accent hover:text-theme-accent-hover transition-colors"
          >
            Upgrade
          </a>
        )}
      </div>
      <div className="space-y-3">
        <Bar
          label="Projects"
          current={projects.current}
          limit={projects.limit}
          color="bg-blue-500"
        />
        <Bar
          label="Pages"
          current={pages.current}
          limit={pages.limit}
          color="bg-violet-500"
        />
        <Bar
          label="Team Members"
          current={members.current}
          limit={members.limit}
          color="bg-amber-500"
        />
      </div>
      {!isEnterprise && tierConfig.customDomain && (
        <p className="text-xs text-theme-muted">Custom domains included</p>
      )}
    </div>
  );
}
