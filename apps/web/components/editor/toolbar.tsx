'use client';

import { useState } from 'react';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  Link as LinkIcon, Code, List, ListOrdered, Quote,
  CheckSquare, Minus, Table, Image as ImageIcon, Code2,
  GitBranch, Columns, FileText, Undo2, Redo2, ChevronDown,
  Type, Sparkles,
} from 'lucide-react';

interface EditorToolbarProps {
  onAction: (action: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface ButtonDef {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
}

const TEXT_BUTTONS: ButtonDef[] = [
  { id: 'bold', icon: Bold, label: 'Bold', shortcut: '⌘B' },
  { id: 'italic', icon: Italic, label: 'Italic', shortcut: '⌘I' },
  { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', shortcut: '⌘⇧X' },
  { id: 'code', icon: Code, label: 'Inline Code', shortcut: '`' },
  { id: 'link', icon: LinkIcon, label: 'Link', shortcut: '⌘K' },
];

const HEADING_BUTTONS: ButtonDef[] = [
  { id: 'h1', icon: Heading1, label: 'Heading 1', shortcut: '⌘⌥1' },
  { id: 'h2', icon: Heading2, label: 'Heading 2', shortcut: '⌘⌥2' },
  { id: 'h3', icon: Heading3, label: 'Heading 3', shortcut: '⌘⌥3' },
];

const LIST_BUTTONS: ButtonDef[] = [
  { id: 'bullet-list', icon: List, label: 'Bullets', shortcut: '⌘⇧8' },
  { id: 'numbered-list', icon: ListOrdered, label: 'Numbers', shortcut: '⌘⇧7' },
  { id: 'task-list', icon: CheckSquare, label: 'Task', shortcut: '⌘⇧9' },
  { id: 'blockquote', icon: Quote, label: 'Quote', shortcut: '⌘⇧.' },
];

const BLOCK_BUTTONS: ButtonDef[] = [
  { id: 'code-block', icon: Code2, label: 'Code Block', shortcut: '⌘⌥C' },
  { id: 'table', icon: Table, label: 'Table' },
  { id: 'divider', icon: Minus, label: 'Divider' },
  { id: 'callout', icon: FileText, label: 'Callout' },
  { id: 'mermaid', icon: GitBranch, label: 'Mermaid' },
  { id: 'image', icon: ImageIcon, label: 'Image' },
  { id: 'columns', icon: Columns, label: 'Columns' },
];

function ToolbarButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  active,
}: {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  onClick: () => void;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        onClick={onClick}
        className={`p-2 sm:p-1.5 rounded-md transition-all duration-150 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 ${
          active
            ? 'bg-theme-accent/15 text-theme-accent'
            : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
        }`}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
      {hovered && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-[100] pointer-events-none">
          <div className="bg-theme-card border border-theme-border rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
            <div className="text-[11px] font-medium text-theme-main">{label}</div>
            {shortcut && (
              <div className="text-[10px] text-theme-muted mt-0.5">{shortcut}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-theme-border mx-0.5" />;
}

export function EditorToolbar({ onAction, canUndo = true, canRedo = true }: EditorToolbarProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex items-center gap-1 px-3 sm:px-4 py-1.5 border-b border-theme-border bg-theme-page/50 mobile-toolbar-scroll">
      {/* Text formatting */}
      <div className="flex items-center gap-0.5">
        {TEXT_BUTTONS.map((btn) => (
          <ToolbarButton
            key={btn.id}
            icon={btn.icon}
            label={btn.label}
            shortcut={btn.shortcut}
            onClick={() => onAction(btn.id)}
          />
        ))}
      </div>

      <Divider />

      {/* Headings */}
      <div className="flex items-center gap-0.5">
        {HEADING_BUTTONS.map((btn) => (
          <ToolbarButton
            key={btn.id}
            icon={btn.icon}
            label={btn.label}
            shortcut={btn.shortcut}
            onClick={() => onAction(btn.id)}
          />
        ))}
      </div>

      <Divider />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        {LIST_BUTTONS.map((btn) => (
          <ToolbarButton
            key={btn.id}
            icon={btn.icon}
            label={btn.label}
            shortcut={btn.shortcut}
            onClick={() => onAction(btn.id)}
          />
        ))}
      </div>

      <Divider />

      {/* Blocks */}
      <div className="flex items-center gap-0.5">
        {BLOCK_BUTTONS.map((btn) => (
          <ToolbarButton
            key={btn.id}
            icon={btn.icon}
            label={btn.label}
            shortcut={btn.shortcut}
            onClick={() => onAction(btn.id)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* AI Actions */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={Sparkles}
          label="AI Assistant"
          shortcut="⌘⇧A"
          onClick={() => onAction('ai-chat')}
        />
      </div>

      <Divider />

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={Undo2}
          label="Undo"
          shortcut="⌘Z"
          onClick={() => onAction('undo')}
          active={!canUndo}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          shortcut="⌘⇧Z"
          onClick={() => onAction('redo')}
          active={!canRedo}
        />
      </div>
    </div>
  );
}
