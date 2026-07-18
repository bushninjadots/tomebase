'use client';

import { DocSidebar } from './sidebar';
import { DocEditor } from './editor';

interface Project {
  id: string;
  name: string;
  pages: {
    id: string;
    title: string;
    slug: string;
    content: string;
    description: string | null;
    order: number;
    parentId: string | null;
  }[];
}

export function DocEditorWithAI({ project }: { project: Project }) {
  return (
    <div className="flex h-screen overflow-hidden bg-theme-page">
      <DocSidebar project={project} />
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DocEditor project={project} />
      </main>
    </div>
  );
}
