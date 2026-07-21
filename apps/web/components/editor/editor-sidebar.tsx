'use client';

import { X, ListOrdered, Users, MessageSquare } from 'lucide-react';
import { DocumentOutline } from '@/components/editor/document-outline';
import { TeamPresence } from '@/components/editor/team-presence';
import { Comments } from '@/components/comments';
import type { DocPage } from '@fluid/types';
import type { SidebarTab } from './editor-types';

interface EditorSidebarProps {
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab | null) => void;
  content: string;
  activeHeadingId: string | null;
  teamMembers: Array<{ id: string; name: string | null; email: string | null; image: string | null }>;
  selectedPage: DocPage;
}

export function EditorSidebar({
  sidebarTab,
  setSidebarTab,
  content,
  activeHeadingId,
  teamMembers,
  selectedPage,
}: EditorSidebarProps) {
  return (
    <div className="w-72 shrink-0 border-l border-theme-border bg-theme-page flex flex-col animate-in slide-in-from-right duration-200">
      {/* Tabs */}
      <div className="flex items-center border-b border-theme-border">
        {([
          { id: 'outline' as SidebarTab, label: 'Outline', icon: ListOrdered },
          { id: 'team' as SidebarTab, label: 'Team', icon: Users },
          { id: 'comments' as SidebarTab, label: 'Comments', icon: MessageSquare },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSidebarTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors duration-150 border-b-2 ${
              sidebarTab === id
                ? 'text-theme-accent border-theme-accent'
                : 'text-theme-muted border-transparent hover:text-theme-subtle'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        <button
          onClick={() => setSidebarTab(null)}
          className="p-2 text-theme-muted hover:bg-theme-hover transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {sidebarTab === 'outline' && <DocumentOutline content={content} activeHeadingId={activeHeadingId} />}
        {sidebarTab === 'team' && <TeamPresence members={teamMembers} />}
        {sidebarTab === 'comments' && <Comments pageId={selectedPage.id} teamMembers={teamMembers} />}
      </div>
    </div>
  );
}
