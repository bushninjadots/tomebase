'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Table,
  Image as ImageIcon,
  Code,
  GitBranch,
  AlertTriangle,
  CheckSquare,
  Quote,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  FileText,
  Link as LinkIcon,
  List,
  ListOrdered,
  Columns,
  Type,
  Code2,
} from 'lucide-react';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: string;
  aliases: string[];
  insert: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    category: 'Text',
    aliases: ['h1', 'title'],
    insert: '# ',
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    category: 'Text',
    aliases: ['h2', 'subtitle'],
    insert: '## ',
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    category: 'Text',
    aliases: ['h3'],
    insert: '### ',
  },
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Plain text paragraph',
    icon: Type,
    category: 'Text',
    aliases: ['p', 'text', 'body'],
    insert: '',
  },
  {
    id: 'bulleted-list',
    label: 'Bulleted List',
    description: 'Create a bulleted list',
    icon: List,
    category: 'Text',
    aliases: ['ul', 'bullet', 'list'],
    insert: '- ',
  },
  {
    id: 'numbered-list',
    label: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    category: 'Text',
    aliases: ['ol', 'ordered', 'number'],
    insert: '1. ',
  },
  {
    id: 'checklist',
    label: 'Checklist',
    description: 'Task list with checkboxes',
    icon: CheckSquare,
    category: 'Text',
    aliases: ['task', 'todo', 'checkbox'],
    insert: '- [ ] ',
  },
  {
    id: 'quote',
    label: 'Blockquote',
    description: 'Capture a quote',
    icon: Quote,
    category: 'Text',
    aliases: ['blockquote', 'callout-quote'],
    insert: '> ',
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal rule separator',
    icon: Minus,
    category: 'Blocks',
    aliases: ['hr', 'separator', 'line'],
    insert: '\n---\n',
  },
  {
    id: 'code',
    label: 'Code Block',
    description: 'Syntax-highlighted code',
    icon: Code,
    category: 'Blocks',
    aliases: ['codeblock', 'pre'],
    insert: '```javascript\n\n```',
  },
  {
    id: 'code-inline',
    label: 'Inline Code',
    description: 'Code within text',
    icon: Code2,
    category: 'Blocks',
    aliases: ['mono'],
    insert: '`code`',
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Markdown table with headers',
    icon: Table,
    category: 'Blocks',
    aliases: ['grid', 'spreadsheet'],
    insert: '\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n',
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Embed an image',
    icon: ImageIcon,
    category: 'Media',
    aliases: ['img', 'photo', 'picture'],
    insert: '![alt text](url)',
  },
  {
    id: 'link',
    label: 'Link',
    description: 'Add a hyperlink',
    icon: LinkIcon,
    category: 'Media',
    aliases: ['url', 'href', 'anchor'],
    insert: '[link text](url)',
  },
  {
    id: 'mermaid',
    label: 'Mermaid Diagram',
    description: 'Flowchart or diagram',
    icon: GitBranch,
    category: 'Blocks',
    aliases: ['diagram', 'chart', 'flowchart'],
    insert: '```mermaid\ngraph TD\n    A[Start] --> B[End]\n```',
  },
  {
    id: 'callout-note',
    label: 'Callout: Note',
    description: 'Informational callout box',
    icon: FileText,
    category: 'Callouts',
    aliases: ['note', 'info'],
    insert: '> [!NOTE]\n> ',
  },
  {
    id: 'callout-warning',
    label: 'Callout: Warning',
    description: 'Warning callout box',
    icon: AlertTriangle,
    category: 'Callouts',
    aliases: ['warn', 'caution'],
    insert: '> [!WARNING]\n> ',
  },
  {
    id: 'callout-tip',
    label: 'Callout: Tip',
    description: 'Helpful tip callout',
    icon: FileText,
    category: 'Callouts',
    aliases: ['tip', 'hint'],
    insert: '> [!TIP]\n> ',
  },
  {
    id: 'callout-danger',
    label: 'Callout: Danger',
    description: 'Danger/critical callout',
    icon: AlertTriangle,
    category: 'Callouts',
    aliases: ['danger', 'critical', 'error'],
    insert: '> [!DANGER]\n> ',
  },
  {
    id: 'columns',
    label: 'Two Columns',
    description: 'Side-by-side content layout',
    icon: Columns,
    category: 'Layout',
    aliases: ['col', '2col', 'split'],
    insert: '\n| Left | Right |\n|------|-------|\n|      |       |\n',
  },
];

interface SlashCommandMenuProps {
  open: boolean;
  query: string;
  position: { top: number; left: number };
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ open, query, position, onSelect, onClose }: SlashCommandMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter((cmd) => {
    const lower = query.toLowerCase();
    if (!lower) return true;
    if (cmd.label.toLowerCase().includes(lower)) return true;
    if (cmd.id.toLowerCase().includes(lower)) return true;
    if (cmd.aliases.some((a) => a.toLowerCase().includes(lower))) return true;
    if (cmd.description.toLowerCase().includes(lower)) return true;
    return false;
  }).sort((a, b) => {
    const lower = query.toLowerCase();
    if (!lower) return 0;
    const aLabel = a.label.toLowerCase();
    const bLabel = b.label.toLowerCase();
    const aStarts = aLabel.startsWith(lower);
    const bStarts = bLabel.startsWith(lower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    const aId = a.id.toLowerCase();
    const bId = b.id.toLowerCase();
    const aIdStarts = aId.startsWith(lower);
    const bIdStarts = bId.startsWith(lower);
    if (aIdStarts && !bIdStarts) return -1;
    if (!aIdStarts && bIdStarts) return 1;
    return 0;
  });

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filtered[activeIndex]) {
          onSelect(filtered[activeIndex]!);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, activeIndex, onSelect, onClose]);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  if (!open || filtered.length === 0) return null;

  const categories = [...new Set(filtered.map((c) => c.category))];

  let globalIdx = 0;

  return createPortal(
    <div
      ref={listRef}
      className="fixed z-[200] w-72 max-h-80 overflow-y-auto rounded-xl border border-theme-border bg-theme-card shadow-2xl"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-theme-muted border-b border-theme-border bg-theme-card/50 sticky top-0">
        Commands {query && `\u2014 "${query}"`}
      </div>
      {categories.map((category) => {
        const items = filtered.filter((c) => c.category === category);
        return (
          <div key={category}>
            <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-theme-muted/60">
              {category}
            </div>
            {items.map((cmd) => {
              const idx = globalIdx++;
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => onSelect(cmd)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                    idx === activeIndex
                      ? 'bg-theme-accent-light text-theme-main'
                      : 'text-theme-subtle hover:bg-theme-hover'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      idx === activeIndex
                        ? 'bg-theme-accent/20 text-theme-accent'
                        : 'bg-theme-hover text-theme-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{cmd.label}</div>
                    <div className="text-[11px] text-theme-muted truncate">{cmd.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>,
    document.body
  );
}
