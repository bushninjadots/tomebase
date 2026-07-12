'use client';

import { Lightbulb, FileCode } from 'lucide-react';

interface SmartSuggestionsProps {
  functions: number;
  interfaces: number;
  hasJSDoc: boolean;
  language: string;
}

export function SmartSuggestions({ functions, interfaces, hasJSDoc, language }: SmartSuggestionsProps) {
  const suggestions: string[] = [];

  if (functions === 1 && interfaces > 0) {
    suggestions.push('Consider documenting related helper functions alongside your interfaces.');
  }
  if (!hasJSDoc) {
    suggestions.push('Adding documentation comments will improve generated documentation quality.');
  }
  if (interfaces > 0 && functions === 0) {
    suggestions.push('Generated documentation includes API reference for your interfaces only.');
  }
  if (functions > 5) {
    suggestions.push('Large code files may benefit from splitting into focused modules.');
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Suggestions</h3>
      </div>
      <div className="space-y-1.5">
        {suggestions.map((s, i) => (
          <p key={i} className="text-xs text-theme-muted flex items-start gap-2">
            <span className="text-amber-400 mt-px">·</span>
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}
