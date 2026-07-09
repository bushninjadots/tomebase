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
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={isAtLimit ? 'text-red-600 font-medium' : isNearLimit ? 'text-amber-600' : 'text-gray-500 dark:text-gray-400'}>
          {current}/{limit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
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
    <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 capitalize dark:text-white">{tier} plan</h3>
        {!isEnterprise && (
          <a
            href="/pricing"
            className="text-xs font-medium text-fluid-600 hover:text-fluid-700 transition-colors dark:text-fluid-400 dark:hover:text-fluid-300"
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
        <p className="text-xs text-gray-400 dark:text-gray-500">Custom domains included</p>
      )}
    </div>
  );
}
