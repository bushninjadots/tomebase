'use client';

import { useState, useCallback, type ReactNode } from 'react';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  Link as LinkIcon, Code, Code2, List, ListOrdered, Quote,
  CheckSquare, Minus, Table, Image as ImageIcon, FileText,
  GitBranch, Columns, AlignLeft, Undo2, Redo2, ChevronDown,
} from 'lucide-react';

interface ToolbarButton {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  action: () => void;
  group: 'text' | 'blocks' | 'media';
  className?: string;
}

interface ToolbarGroup {
  id: string;
  label: string;
  buttons: ToolbarButton[];
}

interface EditorToolbarProps {
  onAction: (action: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function EditorToolbar({ onAction, canUndo = true, canRedo = true }: EditorToolbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const groups: ToolbarGroup[] = [
    {
      id: 'text',
      label: 'Text',
      buttons: [
        { id: 'bold', icon: Bold, label: 'Bold', shortcut: '⌘B', action: () => onAction('bold'), group: 'text' },
        { id: 'italic', icon: Italic, label: 'Italic', shortcut: '⌘I', action: () => onAction('italic'), group: 'text' },
        { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', shortcut: '⌘⇧X', action: () => onAction('strikethrough'), group: 'text' },
        { id: 'code', icon: Code, label: 'Inline Code', shortcut: '`', action: () => onAction('code'), group: 'text' },
        { id: 'link', icon: LinkIcon, label: 'Link', shortcut: '⌘K', action: () => onAction('link'), group: 'text' },
      ],
    },
    {
      id: 'headings',
      label: 'Headings',
      buttons: [
        { id: 'h1', icon: Heading1, label: 'Heading 1', shortcut: '⌘⌥1', action: () => onAction('h1'), group: 'text' },
        { id: 'h2', icon: Heading2, label: 'Heading 2', shortcut: '⌘⌥2', action: () => onAction('h2'), group: 'text' },
        { id: 'h3', icon: Heading3, label: 'Heading 3', shortcut: '⌘⌥3', action: () => onAction('h3'), group: 'text' },
      ],
    },
    {
      id: 'lists',
      label: 'Lists',
      buttons: [
        { id: 'bullet-list', icon: List, label: 'Bulleted List', shortcut: '⌘⇧8', action: () => onAction('bullet-list'), group: 'text' },
        { id: 'numbered-list', icon: ListOrdered, label: 'Numbered List', shortcut: '⌘⇧7', action: () => onAction('numbered-list'), group: 'text' },
        { id: 'task-list', icon: CheckSquare, label: 'Task List', shortcut: '⌘⇧9', action: () => onAction('task-list'), group: 'text' },
        { id: 'blockquote', icon: Quote, label: 'Blockquote', shortcut: '⌘⇧.', action: () => onAction('blockquote'), group: 'text' },
      ],
    },
    {
      id: 'blocks',
      label: 'Blocks',
      buttons: [
        { id: 'code-block', icon: Code2, label: 'Code Block', shortcut: '⌘⌥C', action: () => onAction('code-block'), group: 'blocks' },
        { id: 'divider', icon: Minus, label: 'Divider', shortcut: '---', action: () => onAction('divider'), group: 'blocks' },
        { id: 'mermaid', icon: GitBranch, label: 'Mermaid Diagram', action: () => onAction('mermaid'), group: 'blocks' },
        { id: 'table', icon: Table, label: 'Table', action: () => onAction('table'), group: 'blocks' },
        { id: 'callout', icon: FileText, label: 'Callout', action: () => onAction('callout'), group: 'blocks' },
      ],
    },
    {
      id: 'media',
      label: 'Media',
      buttons: [
        { id: 'image', icon: ImageIcon, label: 'Image', action: () => onAction('image'), group: 'media' },
        { id: 'columns', icon: Columns, label: 'Two Columns', action: () => onAction('columns'), group: 'media' },
      ],
    },
  ];

  const handleDropdownToggle = useCallback((groupId: string) => {
    setActiveDropdown((prev) => (prev === groupId ? null : groupId));
  }, []);

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-theme-border px-3 py-1.5 sm:px-4 shrink-0">
      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-theme-border">
        <ToolbarButtonComponent
          icon={Undo2}
          label="Undo"
          shortcut="⌘Z"
          action={onAction}
          actionId="undo"
          disabled={!canUndo}
        />
        <ToolbarButtonComponent
          icon={Redo2}
          label="Redo"
          shortcut="⌘⇧Z"
          action={onAction}
          actionId="redo"
          disabled={!canRedo}
        />
      </div>

      {/* Toolbar Groups */}
      {groups.map((group, groupIndex) => (
        <div key={group.id} className="flex items-center gap-0.5">
          {groupIndex > 0 && (
            <div className="w-px h-4 bg-theme-border mx-1" />
          )}
          {group.buttons.map((btn) => (
            <ToolbarButtonComponent
              key={btn.id}
              icon={btn.icon}
              label={btn.label}
              shortcut={btn.shortcut}
              action={onAction}
              actionId={btn.id}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ToolbarButtonComponentProps {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  action: (id: string) => void;
  actionId: string;
  disabled?: boolean;
}

function ToolbarButtonComponent({ icon: Icon, label, shortcut, action, actionId, disabled }: ToolbarButtonComponentProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => action(actionId)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={disabled}
        className="group relative shrink-0 rounded-md p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-theme-card border border-theme-border shadow-lg z-50 pointer-events-none">
          <div className="text-xs text-theme-main font-medium whitespace-nowrap">{label}</div>
          {shortcut && (
            <div className="text-[10px] text-theme-muted text-center mt-0.5">
              <kbd className="rounded border border-theme-border bg-theme-hover px-1 py-0.5 text-[9px] font-mono">
                {shortcut}
              </kbd>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolbarDropdown({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="absolute top-full left-0 mt-1 z-50 w-48 rounded-xl border border-theme-border bg-theme-card shadow-xl py-1"
      {...props}
    >
      {children}
    </div>
  );
}

export function ToolbarDropdownItem({ children, onClick, ...props }: { children: ReactNode; onClick?: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-theme-subtle hover:bg-theme-hover transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}
