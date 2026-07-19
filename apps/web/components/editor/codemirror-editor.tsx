'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, highlightActiveLineGutter, rectangularSelection, crosshairCursor, dropCursor } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap, syntaxHighlighting, defaultHighlightStyle, indentUnit } from '@codemirror/language';
import { tomebaseTheme, tomebaseSyntaxHighlighting } from './codemirror-theme';

export interface CodeMirrorEditorRef {
  focus: () => void;
  undo: () => void;
  redo: () => void;
  insertText: (text: string) => void;
  replaceSelection: (text: string) => void;
  getContent: () => string;
  getCursorPos: () => number;
  setCursorPos: (pos: number) => void;
  scrollToLine: (line: number) => void;
  view: EditorView | null;
}

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  typewriterMode?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onCursorChange?: (pos: { line: number; col: number }) => void;
  onSlashCommand?: (query: string) => void;
  onSlashCommandClose?: () => void;
}

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorRef, CodeMirrorEditorProps>(
  function CodeMirrorEditor(
    { value, onChange, className, placeholder, readOnly, typewriterMode, onFocus, onBlur, onCursorChange, onSlashCommand, onSlashCommandClose },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const valueRef = useRef(value);
    const isExternalUpdate = useRef(false);
    const slashQueryRef = useRef('');
    const inSlashCommand = useRef(false);
    const readOnlyCompartment = useRef(new Compartment());
    const typewriterModeRef = useRef(typewriterMode);

    onChangeRef.current = onChange;
    valueRef.current = value;
    typewriterModeRef.current = typewriterMode;

    useImperativeHandle(ref, () => ({
      focus: () => viewRef.current?.focus(),
      undo: () => {
        if (viewRef.current) undo(viewRef.current);
      },
      redo: () => {
        if (viewRef.current) redo(viewRef.current);
      },
      insertText: (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
          changes: { from: view.state.selection.main.head, insert: text },
        });
        view.focus();
      },
      replaceSelection: (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
          changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: text },
        });
        view.focus();
      },
      getContent: () => valueRef.current,
      getCursorPos: () => {
        const view = viewRef.current;
        return view ? view.state.selection.main.head : 0;
      },
      setCursorPos: (pos: number) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({ selection: { anchor: pos } });
      },
      scrollToLine: (line: number) => {
        const view = viewRef.current;
        if (!view) return;
        const lineCount = view.state.doc.lines;
        const targetLine = Math.max(1, Math.min(line, lineCount));
        const lineObj = view.state.doc.line(targetLine);
        view.dispatch({
          selection: { anchor: lineObj.from },
          effects: EditorView.scrollIntoView(lineObj.from, { y: 'center', yMargin: 80 }),
        });
        view.focus();
      },
      view: viewRef.current,
    }));

    const createSlashCommandHandler = useCallback(() => {
      return EditorView.updateListener.of((update) => {
        if (!update.docChanged || !onSlashCommand || !onSlashCommandClose) return;

        const changes = update.changes;
        let insertedText = '';
        changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
          insertedText = inserted.toString();
        });

        if (insertedText === '/' && !inSlashCommand.current) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          const textBefore = line.text.slice(0, pos - line.from);
          const charBefore = textBefore.slice(-1);
          if (charBefore === '' || charBefore === '\n' || charBefore === ' ') {
            inSlashCommand.current = true;
            slashQueryRef.current = '';
            onSlashCommand('');
          }
          return;
        }

        if (inSlashCommand.current) {
          if (insertedText === '\n' || insertedText === 'Escape') {
            inSlashCommand.current = false;
            slashQueryRef.current = '';
            onSlashCommandClose();
            return;
          }

          if (insertedText.length === 1 && insertedText !== '/') {
            slashQueryRef.current += insertedText;
            onSlashCommand(slashQueryRef.current);
          }

          if (insertedText.length > 1) {
            inSlashCommand.current = false;
            slashQueryRef.current = '';
            onSlashCommandClose();
          }
        }
      });
    }, [onSlashCommand, onSlashCommandClose]);

    useEffect(() => {
      if (!containerRef.current) return;

      const themeCompartment = new Compartment();

      const slashKeymap = keymap.of([
        {
          key: 'Escape',
          run: () => {
            if (inSlashCommand.current) {
              inSlashCommand.current = false;
              slashQueryRef.current = '';
              onSlashCommandClose?.();
              return true;
            }
            return false;
          },
        },
      ]);

      function wrapSelection(view: EditorView, prefix: string, suffix: string) {
        const { from, to } = view.state.selection.main;
        const selected = view.state.sliceDoc(from, to);
        const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
        view.dispatch({ changes: { from, to, insert: replacement } });
        view.focus();
      }

      const typewriterExtension = EditorView.updateListener.of((update) => {
        if (!typewriterModeRef.current) return;
        if (update.selectionSet || update.docChanged) {
          requestAnimationFrame(() => {
            const view = viewRef.current;
            if (!view) return;
            const { head } = view.state.selection.main;
            view.dispatch({ effects: EditorView.scrollIntoView(head, { y: 'center', yMargin: 50 }) });
          });
        }
      });

      const markdownKeymap = keymap.of([
        {
          key: 'Mod-b',
          run: (view) => { wrapSelection(view, '**', '**'); return true; },
        },
        {
          key: 'Mod-i',
          run: (view) => { wrapSelection(view, '*', '*'); return true; },
        },
        {
          key: 'Mod-Shift-x',
          run: (view) => { wrapSelection(view, '~~', '~~'); return true; },
        },
        {
          key: 'Mod-`',
          run: (view) => { wrapSelection(view, '`', '`'); return true; },
        },
        {
          key: 'Mod-k',
          run: (view) => {
            const { from, to } = view.state.selection.main;
            const selected = view.state.sliceDoc(from, to);
            const insert = selected ? `[${selected}](url)` : '[text](url)';
            view.dispatch({ changes: { from, to, insert } });
            view.focus();
            return true;
          },
        },
      ]);

      const state = EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          dropCursor(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          rectangularSelection(),
          crosshairCursor(),
          highlightSelectionMatches(),
          history({ minDepth: 200 }),
          foldGutter({
            openText: '\u25BE',
            closedText: '\u25B8',
          }),
          indentUnit.of('  '),
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          themeCompartment.of(tomebaseTheme),
          tomebaseSyntaxHighlighting,
          readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly ?? false)),
          markdownKeymap,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            indentWithTab,
            {
              key: 'Mod-s',
              run: () => true,
            },
          ]),
          slashKeymap,
          createSlashCommandHandler(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !isExternalUpdate.current) {
              onChangeRef.current(update.state.doc.toString());
            }
            if (update.selectionSet && onCursorChange) {
              const pos = update.state.selection.main.head;
              const line = update.state.doc.lineAt(pos);
              onCursorChange({ line: line.number, col: pos - line.from + 1 });
            }
          }),
          EditorView.lineWrapping,
          EditorView.domEventHandlers({
            focus: () => onFocus?.(),
            blur: () => onBlur?.(),
          }),
          placeholder ? EditorView.contentAttributes.of({ 'aria-placeholder': placeholder }) : [],
          typewriterExtension,
        ],
      });

      const view = new EditorView({
        state,
        parent: containerRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const currentDoc = view.state.doc.toString();
      if (currentDoc !== value) {
        isExternalUpdate.current = true;
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: value },
        });
        isExternalUpdate.current = false;
      }
    }, [value]);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly ?? false)),
      });
    }, [readOnly]);

    return <div ref={containerRef} className={className} />;
  }
);
