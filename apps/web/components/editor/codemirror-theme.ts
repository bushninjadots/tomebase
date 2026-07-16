import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const tomebaseTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--text-main)',
      backgroundColor: 'transparent',
    },
    '.cm-content': {
      caretColor: 'var(--accent)',
      fontFamily: "var(--font-sans), 'Inter', system-ui, sans-serif",
      fontSize: '15px',
      lineHeight: '1.75',
      padding: '24px 0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--accent)',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--accent)',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--bg-hover)',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'var(--accent-light)',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--accent-light)',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
      border: 'none',
      minWidth: '48px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'var(--text-subtle)',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'var(--accent-light)',
      border: 'none',
      color: 'var(--accent)',
    },
    '.cm-tooltip': {
      border: '1px solid var(--border-theme)',
      backgroundColor: 'var(--bg-card)',
      borderRadius: '10px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: 'var(--bg-card)',
      borderBottomColor: 'var(--bg-card)',
    },
    '.cm-tooltip-autocomplete': {
      borderRadius: '10px',
      overflow: 'hidden',
    },
    '.cm-tooltip-autocomplete > ul > li': {
      padding: '4px 12px',
      fontSize: '13px',
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--accent-light)',
      color: 'var(--text-main)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'var(--accent-light)',
      outline: '1px solid var(--accent)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'var(--accent-light)',
      outline: '1px solid var(--accent)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'var(--accent)',
      color: 'var(--text-main)',
    },
    '.cm-panels': {
      backgroundColor: 'var(--bg-card)',
      color: 'var(--text-main)',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid var(--border-theme)',
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: '1px solid var(--border-theme)',
    },
    '.cm-textfield': {
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-theme)',
      color: 'var(--text-main)',
      borderRadius: '6px',
      padding: '2px 6px',
    },
    '.cm-button': {
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-subtle)',
      border: '1px solid var(--border-theme)',
      borderRadius: '6px',
    },
  },
  { dark: false }
);

export const tomebaseHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.75em', fontWeight: 'bold', color: 'var(--text-main)' },
  { tag: tags.heading2, fontSize: '1.5em', fontWeight: 'bold', color: 'var(--text-main)' },
  { tag: tags.heading3, fontSize: '1.25em', fontWeight: 'bold', color: 'var(--text-main)' },
  { tag: tags.heading4, fontSize: '1.1em', fontWeight: '600', color: 'var(--text-main)' },
  { tag: tags.heading5, fontSize: '1em', fontWeight: '600', color: 'var(--text-main)' },
  { tag: tags.heading6, fontSize: '0.95em', fontWeight: '600', color: 'var(--text-subtle)' },
  { tag: tags.strong, fontWeight: 'bold', color: 'var(--text-main)' },
  { tag: tags.emphasis, fontStyle: 'italic', color: 'var(--text-main)' },
  { tag: tags.strikethrough, textDecoration: 'linethrough', color: 'var(--text-muted)' },
  { tag: tags.link, color: 'var(--accent)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--accent)' },
  { tag: tags.string, color: '#34d399' },
  { tag: tags.keyword, color: '#a78bfa' },
  { tag: tags.atom, color: '#f59e0b' },
  { tag: tags.bool, color: '#f59e0b' },
  { tag: tags.number, color: '#f59e0b' },
  { tag: tags.variableName, color: 'var(--text-main)' },
  { tag: tags.propertyName, color: '#60a5fa' },
  { tag: tags.comment, color: 'var(--text-muted)', fontStyle: 'italic' },
  { tag: tags.lineComment, color: 'var(--text-muted)', fontStyle: 'italic' },
  { tag: tags.blockComment, color: 'var(--text-muted)', fontStyle: 'italic' },
  { tag: tags.meta, color: 'var(--text-muted)' },
  { tag: tags.tagName, color: '#ef4444' },
  { tag: tags.attributeName, color: 'var(--accent)' },
  { tag: tags.attributeValue, color: '#34d399' },
  { tag: tags.regexp, color: '#ef4444' },
  { tag: tags.escape, color: 'var(--accent)' },
  { tag: tags.special(tags.string), color: '#22d3ee' },
  { tag: tags.monospace, fontFamily: "var(--font-mono), 'JetBrains Mono', 'Fira Code', monospace", fontSize: '0.9em', color: '#ef4444' },
  { tag: tags.processingInstruction, color: 'var(--text-muted)' },
  { tag: tags.invalid, color: '#ef4444' },
  { tag: tags.quote, color: 'var(--text-muted)', fontStyle: 'italic' },
  { tag: tags.contentSeparator, color: 'var(--accent)' },
  { tag: tags.list, color: 'var(--accent)' },
  { tag: tags.inserted, color: '#34d399' },
  { tag: tags.deleted, color: '#ef4444' },
  { tag: tags.changed, color: 'var(--accent)' },
]);

export const tomebaseSyntaxHighlighting = syntaxHighlighting(tomebaseHighlightStyle);
