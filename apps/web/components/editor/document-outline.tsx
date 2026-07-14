'use client';

import { useMemo, useState } from 'react';
import { Hash, ChevronRight, ChevronDown } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface DocumentOutlineProps {
  content: string;
  onNavigate?: (id: string) => void;
}

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1]!.length;
      const text = match[2]!.trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function DocumentOutline({ content, onNavigate }: DocumentOutlineProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  if (headings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-theme-hover flex items-center justify-center mb-3">
          <Hash className="w-4 h-4 text-theme-muted" />
        </div>
        <p className="text-xs text-theme-muted leading-relaxed">
          Add headings to your document<br />to see the outline here
        </p>
      </div>
    );
  }

  // Group by level 2 (sections)
  const sections = headings.filter((h) => h.level === 2);
  const hasH2 = sections.length > 0;

  function handleClick(heading: Heading) {
    const el = document.getElementById(heading.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onNavigate?.(heading.id);
    }
  }

  if (!hasH2) {
    // Flat list for documents without H2
    return (
      <nav className="space-y-0.5">
        {headings.map((h) => (
          <button
            key={h.id}
            onClick={() => handleClick(h)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors duration-150"
            style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
          >
            <span className="truncate">{h.text}</span>
          </button>
        ))}
      </nav>
    );
  }

  // Nested list with collapsible sections
  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const isCollapsed = collapsed.has(headings.indexOf(section));
        const sectionIdx = headings.indexOf(section);
        const children: Heading[] = [];
        for (let i = sectionIdx + 1; i < headings.length; i++) {
          if (headings[i]!.level <= section.level) break;
          children.push(headings[i]!);
        }

        return (
          <div key={section.id}>
            <button
              onClick={() => handleClick(section)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left text-sm font-medium text-theme-main hover:bg-theme-hover transition-colors duration-150 group"
            >
              {children.length > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCollapsed((prev) => {
                      const next = new Set(prev);
                      if (next.has(sectionIdx)) next.delete(sectionIdx);
                      else next.add(sectionIdx);
                      return next;
                    });
                  }}
                  className="p-0.5 rounded hover:bg-theme-hover"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 text-theme-muted" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-theme-muted" />
                  )}
                </span>
              )}
              <span className="truncate">{section.text}</span>
            </button>
            {children.length > 0 && !isCollapsed && (
              <div className="ml-3 border-l border-theme-border pl-1 mt-0.5 space-y-0.5">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleClick(child)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-left text-[13px] text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors duration-150"
                  >
                    <span className="truncate">{child.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
