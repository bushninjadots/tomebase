'use client';

import { DocSidebar } from './sidebar';
import { DocEditor } from './editor';
import type { ProjectWithPages } from '@fluid/types';

export function DocEditorWithAI({ project, initialLine, initialPageSlug }: {
  project: ProjectWithPages;
  initialLine?: number;
  initialPageSlug?: string;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-theme-page">
      <DocSidebar project={project} />
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DocEditor project={project} initialLine={initialLine} initialPageSlug={initialPageSlug} />
      </main>
    </div>
  );
}
