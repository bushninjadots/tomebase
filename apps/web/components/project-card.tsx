'use client';

import Link from 'next/link';
import { Globe, ArrowRight } from 'lucide-react';

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
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
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
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-hover transition-colors group">
      <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-theme-main truncate group-hover:text-theme-accent transition-colors">
          {name}
        </p>
        <p className="text-xs text-theme-muted mt-0.5">
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          {published && (
            <>
              <span className="mx-1">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <Globe className="h-3 w-3 inline" /> Live
              </span>
            </>
          )}
          <span className="mx-1">·</span>
          {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {healthScore !== null && (
          <div className="flex items-center gap-1.5 text-xs text-theme-muted">
            <HealthDot score={healthScore} />
            <span>{healthScore}</span>
          </div>
        )}
        <Link
          href={`/docs/${id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-theme-accent px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-theme-accent-hover transition-colors"
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
