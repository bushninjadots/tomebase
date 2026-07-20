import { EditorView, Decoration, DecorationSet, ViewPlugin, WidgetType, type ViewUpdate } from '@codemirror/view';
import { StateField, StateEffect, type EditorState } from '@codemirror/state';
import type { Diagnostic } from '@fluid/types';

const setDiagnostics = StateEffect.define<Diagnostic[]>();

const diagnosticField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    for (const e of tr.effects) {
      if (e.is(setDiagnostics)) {
        return buildDecorations(e.value, tr.state);
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

function severityDecoration(d: Diagnostic) {
  switch (d.severity) {
    case 'error':
      return Decoration.line({
        attributes: {
          class: 'cm-diagnostic-error',
          'data-diagnostic-id': d.id,
        },
      });
    case 'warning':
      return Decoration.line({
        attributes: {
          class: 'cm-diagnostic-warning',
          'data-diagnostic-id': d.id,
        },
      });
    case 'info':
      return Decoration.line({
        attributes: {
          class: 'cm-diagnostic-info',
          'data-diagnostic-id': d.id,
        },
      });
  }
}

function headingHighlight(d: Diagnostic) {
  if (!d.line) return null;
  const headingCategories = [
    'heading_hierarchy',
    'multiple_h1',
    'missing_blank_line_before_heading',
    'missing_blank_line_after_heading',
    'heading_ends_with_colon',
    'trailing_punctuation_in_heading',
  ];
  if (!headingCategories.includes(d.category)) return null;
  return Decoration.line({
    attributes: {
      class: 'cm-diagnostic-heading-highlight',
    },
  });
}

function buildDecorations(diagnostics: Diagnostic[], state: EditorState): DecorationSet {
  const decorations: Array<{ from: number; to: number; value: Decoration }> = [];
  const seen = new Set<number>();

  for (const d of diagnostics) {
    if (!d.line || d.line < 1) continue;
    if (d.line > state.doc.lines) continue;
    if (seen.has(d.line)) continue;
    seen.add(d.line);

    const line = state.doc.line(d.line);
    decorations.push({
      from: line.from,
      to: line.from,
      value: severityDecoration(d),
    });

    const heading = headingHighlight(d);
    if (heading) {
      decorations.push({
        from: line.from,
        to: line.from,
        value: heading,
      });
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decorations, true);
}

class DiagnosticGutterWidget extends WidgetType {
  constructor(
    private diagnostics: Diagnostic[],
    private onJump?: (line: number) => void,
  ) {
    super();
  }

  toDOM() {
    const el = document.createElement('div');
    el.className = 'cm-diagnostic-gutter-marker';
    el.title = this.diagnostics
      .map((d) => `[${d.severity}] ${d.title}`)
      .join('\n');

    const dot = document.createElement('span');
    const worst = this.diagnostics.find((d) => d.severity === 'error')
      ?? this.diagnostics.find((d) => d.severity === 'warning')
      ?? this.diagnostics[0];
    dot.className = `cm-diagnostic-dot cm-diagnostic-dot-${worst?.severity ?? 'info'}`;
    el.appendChild(dot);

    if (this.onJump && this.diagnostics.length > 0 && this.diagnostics[0]?.line) {
      el.style.cursor = 'pointer';
      const line = this.diagnostics[0].line;
      el.addEventListener('click', () => {
        this.onJump!(line);
      });
    }

    return el;
  }

  override eq(other: DiagnosticGutterWidget) {
    if (this.diagnostics.length !== other.diagnostics.length) return false;
    return this.diagnostics.every((d, i) => d.id === other.diagnostics[i]?.id);
  }
}

function diagnosticGutter(onJump?: (line: number) => void) {
  const field = StateField.define<DecorationSet>({
    create() {
      return Decoration.none;
    },
    update(deco, tr) {
      for (const e of tr.effects) {
        if (e.is(setDiagnostics)) {
          return buildGutterDecorations(e.value, tr.state, onJump);
        }
      }
      return deco;
    },
    provide: (f) => EditorView.decorations.from(f),
  });

  return field;
}

function buildGutterDecorations(
  diagnostics: Diagnostic[],
  state: EditorState,
  onJump?: (line: number) => void,
): DecorationSet {
  const byLine = new Map<number, Diagnostic[]>();
  for (const d of diagnostics) {
    if (!d.line || d.line < 1 || d.line > state.doc.lines) continue;
    const existing = byLine.get(d.line);
    if (existing) {
      existing.push(d);
    } else {
      byLine.set(d.line, [d]);
    }
  }

  const decorations: Array<{ from: number; to: number; value: Decoration }> = [];
  for (const [lineNum, lineDiags] of byLine) {
    const line = state.doc.line(lineNum);
    decorations.push({
      from: line.from,
      to: line.from,
      value: Decoration.widget({
        widget: new DiagnosticGutterWidget(lineDiags, onJump),
        side: -1,
      }),
    });
  }

  decorations.sort((a, b) => a.from - b.from);
  return Decoration.set(decorations, true);
}

export function diagnosticMarkers(
  diagnostics: Diagnostic[],
  onJump?: (line: number) => void,
) {
  return [
    diagnosticField,
    EditorView.updateListener.of((update: ViewUpdate) => {
      update.view.dispatch({
        effects: setDiagnostics.of(diagnostics),
      });
    }),
    EditorView.baseTheme({
      '.cm-diagnostic-error': {
        borderBottom: '2px wavy var(--color-red-500, #ef4444)',
        background: 'rgba(239, 68, 68, 0.06)',
      },
      '.cm-diagnostic-warning': {
        borderBottom: '2px wavy var(--color-amber-500, #f59e0b)',
        background: 'rgba(245, 158, 11, 0.06)',
      },
      '.cm-diagnostic-info': {
        borderBottom: '1px dotted var(--color-blue-400, #60a5fa)',
        background: 'rgba(96, 165, 250, 0.04)',
      },
      '.cm-diagnostic-heading-highlight': {
        background: 'rgba(139, 92, 246, 0.08)',
      },
      '.cm-diagnostic-dot': {
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        margin: '2px 4px',
      },
      '.cm-diagnostic-dot-error': { background: '#ef4444' },
      '.cm-diagnostic-dot-warning': { background: '#f59e0b' },
      '.cm-diagnostic-dot-info': { background: '#60a5fa' },
    }),
  ];
}

export function updateDiagnosticsEffect(diagnostics: Diagnostic[]) {
  return setDiagnostics.of(diagnostics);
}

export { setDiagnostics, diagnosticField };
