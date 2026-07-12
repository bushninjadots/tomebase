'use client';

import Link from 'next/link';
import { Globe, ArrowUpRight } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  pageCount: number;
  updatedAt: Date;
  healthScore: number | null;
}

const AVATAR_COLORS = [
  'bg-theme-accent',
  'bg-purple-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-teal-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function HealthDot({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-400'
      : score >= 60
        ? 'bg-amber-400'
        : 'bg-red-400';
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProjectCard({
  id,
  name,
  published,
  pageCount,
  updatedAt,
  healthScore,
}: ProjectCardProps) {
  const initial = name.charAt(0)?.toUpperCase() ?? '?';
  const colorClass = getAvatarColor(name);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-theme-hover transition-colors group">
      <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-theme-main truncate group-hover:text-theme-accent transition-colors">
          {name}
        </p>
        <p className="text-[11px] text-theme-muted mt-0.5 flex items-center gap-1.5">
          <span>{pageCount} page{pageCount === 1 ? '' : 's'}</span>
          <span className="text-theme-border">·</span>
          <span>{timeAgo(new Date(updatedAt))}</span>
          {published && (
            <>
              <span className="text-theme-border">·</span>
              <span className="inline-flex items-center gap-0.5 text-green-400">
                <Globe className="h-2.5 w-2.5" /> Live
              </span>
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {healthScore !== null && (
          <div className="flex items-center gap-1 text-[11px] text-theme-muted">
            <HealthDot score={healthScore} />
            <span>{healthScore}</span>
          </div>
        )}
        <Link
          href={`/docs/${id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-theme-card border border-theme-border px-2.5 py-1.5 text-[11px] font-medium text-theme-subtle hover:bg-theme-accent hover:text-white hover:border-theme-accent transition-all"
        >
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
