import { prisma } from '@fluid/database';
import { getOrCreatePersonalTeam } from '@/lib/team';
import { TIERS } from '@/lib/limits';
import { FileText, Globe, Users, FolderOpen, Eye, Activity } from 'lucide-react';

interface UsageSectionProps {
  userId: string;
}

export async function UsageSection({ userId }: UsageSectionProps) {
  const team = await getOrCreatePersonalTeam(userId);
  const tier = (team.tier || 'free') as keyof typeof TIERS;

  const projects = await prisma.project.findMany({
    where: { teamId: team.id },
    select: { id: true },
  });

  const projectIds = projects.map((p) => p.id);

  const [memberCount, totalPages, publishedCount, totalViews] = await Promise.all([
    prisma.teamMember.count({ where: { teamId: team.id } }),
    prisma.docPage.count({ where: { projectId: { in: projectIds } } }),
    prisma.docPage.count({ where: { projectId: { in: projectIds }, published: true } }),
    prisma.docPage.aggregate({
      where: { projectId: { in: projectIds } },
      _sum: { viewCount: true },
    }),
  ]);

  const viewCount = totalViews._sum.viewCount ?? 0;

  const stats = [
    { icon: FolderOpen, label: 'Projects', value: projects.length, limit: TIERS[tier].maxProjects, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: FileText, label: 'Pages', value: totalPages, limit: TIERS[tier].maxPages, color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: Globe, label: 'Published', value: publishedCount, limit: Infinity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Users, label: 'Members', value: memberCount, limit: TIERS[tier].maxMembers, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Eye, label: 'Total Views', value: viewCount, limit: Infinity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="h-4 w-4 text-theme-muted" />
        <h2 className="text-sm font-semibold text-theme-main">Usage</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isUnlimited = !Number.isFinite(stat.limit);

          return (
            <div key={stat.label} className="rounded-xl border border-theme-border bg-theme-page p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xl font-bold text-theme-main">{stat.value.toLocaleString()}</p>
              <p className="text-[11px] text-theme-muted mt-0.5">
                {stat.label}{!isUnlimited ? ` / ${stat.limit}` : ''}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-theme-border">
        <p className="text-[11px] text-theme-muted">
          Current plan: <span className="font-medium text-theme-subtle">{tier === 'pro' ? 'Pro' : 'Free'}</span>
        </p>
      </div>
    </div>
  );
}
