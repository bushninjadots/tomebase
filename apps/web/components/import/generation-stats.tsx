'use client';

import type { GenerationStats as Stats } from './use-import-wizard';
import { FunctionSquare, Braces, Type, Box, List, Package, Link2, Tag, ArrowUpRight, Timer } from 'lucide-react';

function StatItem({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <span className="text-sm font-bold text-theme-main">{value}</span>
        <span className="text-xs text-theme-muted ml-1">{label}</span>
      </div>
    </div>
  );
}

export function GenerationStats({ stats }: { stats: Stats }) {
  const hasAny = stats.functions || stats.interfaces || stats.types || stats.classes || stats.enums || stats.namespaces;
  if (!hasAny) return null;

  return (
    <div className="rounded-xl border border-theme-border bg-theme-card p-4">
      <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-3">
        Generation Summary
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatItem icon={FunctionSquare} label="functions" value={stats.functions} color="bg-blue-500/10 text-blue-400" />
        <StatItem icon={Braces} label="interfaces" value={stats.interfaces} color="bg-purple-500/10 text-purple-400" />
        <StatItem icon={Type} label="types" value={stats.types} color="bg-green-500/10 text-green-400" />
        <StatItem icon={Box} label="classes" value={stats.classes} color="bg-amber-500/10 text-amber-400" />
        <StatItem icon={List} label="enums" value={stats.enums} color="bg-rose-500/10 text-rose-400" />
        <StatItem icon={Package} label="namespaces" value={stats.namespaces} color="bg-cyan-500/10 text-cyan-400" />
        <StatItem icon={Link2} label="wiki links" value={stats.wikiLinks} color="bg-teal-500/10 text-teal-400" />
        <StatItem icon={Tag} label="tags" value={stats.tags} color="bg-fuchsia-500/10 text-fuchsia-400" />
        <StatItem icon={ArrowUpRight} label="backlinks" value={stats.backlinks} color="bg-cyan-500/10 text-cyan-400" />
      </div>
      <div className="mt-3 pt-3 border-t border-theme-border flex items-center gap-1.5 text-xs text-theme-muted">
        <Timer className="h-3 w-3" />
        Generated in {stats.generationTimeMs < 1000
          ? `${stats.generationTimeMs}ms`
          : `${(stats.generationTimeMs / 1000).toFixed(1)}s`}
      </div>
    </div>
  );
}
