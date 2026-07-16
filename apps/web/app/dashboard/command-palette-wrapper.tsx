'use client';

import { CommandPalette, type CommandPage, type CommandProject } from '@/components/command-palette';

interface DashboardCommandPaletteProps {
  pages: CommandPage[];
  projects: CommandProject[];
  currentProjectId?: string;
}

export function DashboardCommandPalette({ pages, projects, currentProjectId }: DashboardCommandPaletteProps) {
  return (
    <CommandPalette
      pages={pages}
      projects={projects}
      currentProjectId={currentProjectId}
    />
  );
}
