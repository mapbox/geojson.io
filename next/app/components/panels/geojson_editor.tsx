import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorState, Transaction } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import { Button } from 'app/components/elements';
import { CopyIcon } from '@radix-ui/react-icons';
import { writeToClipboard } from 'app/lib/utils';
import { toast } from 'react-hot-toast';
import { linter, lintGutter } from '@codemirror/lint';
import { lib } from 'app/lib/worker';
import type { ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { drawSelection, keymap } from '@codemirror/view';

export const checker = linter(async (view) => {
  const issues = await lib.getIssues(view.state.doc.toString());
  // Filter out issues where both from and to are 0.
  // These are generic errors from @placemark/check-geojson for invalid JSON,
  // which show up at the start of the editor and aren't useful.
  // We rely on jsonParseLinter for accurate JSON error highlighting instead.
  return issues.filter(
    (issue: { from: number; to: number }) =>
      !(issue.from === 0 && issue.to === 0)
  );
});

export function hasImportantChange(view: ViewUpdate): boolean {
  return (
    view.docChanged &&
    view.transactions.some((t) => t.annotation(Transaction.userEvent))
  );
}

interface GeoJSONEditorProps {
  value: any;
  onChange: (value: any) => void;
  theme: any;
  containerClassName?: string;
}

export function GeoJSONEditor({
  value,
  onChange,
  theme,
  containerClassName = 'h-full'
}: GeoJSONEditorProps) {
  const [editor, setEditor] = useState<EditorView | null>(null);
  const mountPointRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorView | null>(null);
  const localValue = useRef<any>(null);

  // Fixed debounce to 300ms
  const debouncedOnChange = useMemo(() => debounce(onChange, 300), [onChange]);

  // Prevent drag and drop files into the editor
  const preventDrop = useMemo(
    () =>
      EditorView.domEventHandlers({
        drop(event) {
          event.preventDefault();
          return true;
        }
      }),
    []
  );

  const extensions = useMemo(
    () => [
      keymap.of([...defaultKeymap, ...historyKeymap]),
      history(),
      drawSelection(),
      json(),
      linter(jsonParseLinter()),
      checker,
      lintGutter(),
      lineNumbers(),
      preventDrop
    ],
    [preventDrop]
  );

  const onChanges = useMemo(
    () =>
      EditorView.updateListener.of((view) => {
        if (!hasImportantChange(view)) {
          return;
        }
        const docStr = view.state.doc.toString();
        try {
          const sent = JSON.parse(docStr);
          localValue.current = sent;
          debouncedOnChange(sent);
        } catch (e) {
          // ignore parse errors, let consumer handle
        }
      }),
    [debouncedOnChange]
  );

  useEffect(() => {
    let instance: EditorView;
    if (
      !editorRef.current &&
      typeof window !== 'undefined' &&
      mountPointRef.current
    ) {
      instance = new EditorView({
        state: EditorState.create({
          doc: JSON.stringify(value, null, 2),
          extensions: [...extensions, theme, onChanges]
        }),
        parent: mountPointRef.current
      });
      editorRef.current = instance;
      setEditor(instance);
    }
    return () => {};
  }, [value, extensions, theme, onChanges]);

  useEffect(() => {
    if (!editor || typeof window === 'undefined') {
      return;
    }
    const overrideValue = () => {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: JSON.stringify(value, null, 2)
        }
      });
      localValue.current = value;
    };
    try {
      if (localValue.current === value) {
        return;
      }
      const editorValue = editor.state.doc.toString();
      const jsonValue = JSON.parse(editorValue);
      if (isEqual(value, jsonValue)) {
        return;
      }
      overrideValue();
    } catch (_e) {
      const editorValue = editor.state.doc.toString();
      if (editorValue.trim() === '') {
        overrideValue();
      }
    }
  }, [editor, value]);

  return (
    <div className="relative group">
      <div className="sticky top-2 z-10 h-0 pointer-events-none">
        <div className="absolute top-0 right-2 pointer-events-auto">
          <Button
            type="button"
            onClick={async () => {
              await toast.promise(
                writeToClipboard(JSON.stringify(value, null, 2)),
                {
                  loading: 'Copying…',
                  success: 'Copied',
                  error: 'Failed to copy. Try again?'
                }
              );
            }}
            className="transition-opacity opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto bg-white sticky top-2 right-2"
            title="Copy JSON to clipboard"
            size="xs"
          >
            <CopyIcon />
            Copy
          </Button>
        </div>
      </div>
      <div className={containerClassName} ref={mountPointRef}></div>
    </div>
  );
}
