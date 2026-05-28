import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  keymap,
  lineNumbers
} from '@codemirror/view';
import {
  CheckIcon,
  QuestionMarkIcon,
  SizeIcon,
  TrashIcon,
  UpdateIcon
} from '@radix-ui/react-icons';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  useEditor
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import * as E from 'app/components/elements';
import useResettable from 'app/hooks/use_resettable';
import { asHTML, castExplicit, ExplicitCast } from 'app/lib/cast';
import { geojsonioTheme } from 'app/lib/codemirror_theme';
import { parseOrError } from 'app/lib/errors';
import { truncate } from 'app/lib/utils';
import classed from 'classed-components';
import clsx from 'clsx';
import * as d3 from 'd3-color';
import { Field, Form, Formik } from 'formik';
import { atom, type PrimitiveAtom, useAtom, useAtomValue } from 'jotai';
import isObject from 'lodash/isObject';
import noop from 'lodash/noop';
import { DropdownMenu as DD, Popover as P, Tooltip as T, Tabs } from 'radix-ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { dataAtom } from 'state/jotai';
import type { JsonObject, JsonValue } from 'type-fest';
import type { CoordProps } from 'types';
import type {
  OnCast,
  OnChangeValue,
  OnDeleteKey,
  Pair,
  PropertyPair
} from '../property_row';

type Preview =
  | {
      kind: 'html';
      value: string;
    }
  | {
      kind: 'code';
      value: string;
    };

type NewValueAtom = PrimitiveAtom<PropertyPair[1]>;

interface PropertyInputProps {
  pair: PropertyPair;
  newValueAtom: NewValueAtom;
  onDeleteKey: OnDeleteKey;
  onCast: OnCast;
  even: boolean;
  readOnly?: boolean;
}

export function coordPropsAttr({ x, y }: CoordProps) {
  return {
    'data-focus-x': x,
    'data-focus-y': y
  };
}

function SimpleText({
  value,
  onChange,
  readOnly
}: {
  value: string;
  onChange: (arg0: string) => void;
  readOnly?: boolean;
}) {
  const mountPointRef = useRef<null>(null);
  const editorRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current && window && mountPointRef.current) {
      const onChanges = EditorView.updateListener.of((v) => {
        if (!v.docChanged) return;
        const val = instance.state.doc.toString();
        onChange(val);
      });
      const instance = new EditorView({
        state: EditorState.create({
          doc: value,
          extensions: [
            keymap.of([...defaultKeymap, ...historyKeymap]),
            history(),
            drawSelection(),
            geojsonioTheme,
            lineNumbers(),
            json(),
            onChanges,
            EditorState.readOnly.of(!!readOnly)
          ]
        }),
        parent: mountPointRef.current
      });

      editorRef.current = instance;
    }
    return () => {};
  }, [value, onChange, readOnly]);

  return (
    <div
      className="flex-auto h-64
        border border-gray-300 dark:border-gray-600 rounded
        overflow-hidden
        focus-visible:border-gray-300"
      ref={mountPointRef}
    />
  );
}

function firstOrOnlyValue(rawValue: Pair[1]): JsonValue | undefined {
  return rawValue instanceof Map ? [...rawValue.keys()][0] : rawValue;
}

/**
 * Display a value type as a single character symbol,
 * meant to be used in the dropdown on each feature row.
 */
export function asSymbol(value: JsonValue): string {
  switch (typeof value) {
    case 'string': {
      return `String`;
    }
    case 'number': {
      return 'Number';
    }
    case 'boolean': {
      return 'Boolean';
    }
    case 'object': {
      if (value && '@type' in value && value['@type'] === 'html') {
        return 'HTML';
      }
      return 'Object';
    }
    default: {
      return 'Other';
    }
  }
}

function triggerStyle(even: boolean) {
  return `
    opacity-0
    transition-opacity
    group-1-hover:opacity-100
    hover:opacity-100
    aria-expanded:opacity-100
    focus:opacity-100
    text-gray-700 dark:text-gray-500
    border dark:border-gray-500
    ${even ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}
    px-1 py-1
    hover:bg-gray-100 dark:hover:bg-gray-900
    aria-expanded:bg-gray-100 dark:aria-expanded:bg-gray-900
    rounded-sm`;
}

const StyledTabTrigger = classed(Tabs.Trigger)(`px-2 py-1 text-xs 
  bg-gray-100
  data-state-active:bg-gray-300
  dark:bg-gray-800 
  dark:data-state-active:bg-gray-500 rounded`);

export enum EditorTab {
  JSON = 'json',
  TEXT = 'text',
  RICH_TEXT = 'rich-text',
  COLOR = 'color'
}

export function guessTab(value: JsonValue | undefined): EditorTab {
  if (typeof value === 'string' && value.length < 80 && d3.color(value)) {
    return EditorTab.COLOR;
  }
  if (typeof value !== 'string') {
    if (isObject(value) && '@type' in value && value['@type'] === 'html') {
      return EditorTab.RICH_TEXT;
    }
    return EditorTab.JSON;
  }

  return EditorTab.TEXT;
}

const StyledWrongTypedValueContainer = classed.div(`block w-full
  text-sm
  h-64 px-4
  border-gray-300 dark:border-gray-600 rounded
  flex items-center justify-center
  dark:bg-gray-800 dark:text-white`);

/**
 * Mainly a color picker.
 */
function ColorValueEditor(props: PropertyInputProps) {
  const [value, setValue] = useAtom(props.newValueAtom);
  const asHex = typeof value === 'string' && d3.color(value)?.formatHex();

  if (!asHex) {
    return (
      <StyledWrongTypedValueContainer>
        <div>
          This value can’t be parsed as a color. Edit it in another mode, or{' '}
          <E.Button
            onClick={() => {
              setValue('#ff0000');
            }}
          >
            start with red.
          </E.Button>
        </div>
      </StyledWrongTypedValueContainer>
    );
  }

  return (
    <div className="space-y-2">
      <div className="border border-white" style={{ borderRadius: 5 }}>
        <HexColorPicker
          style={{
            width: '100%'
          }}
          color={value}
          onChange={(newValue) => setValue(newValue)}
        />
      </div>
      <HexColorInput
        className={E.inputClass({})}
        prefixed
        color={value}
        onChange={(newValue) => setValue(newValue)}
      />
    </div>
  );
}

function RichTextEditor(props: PropertyInputProps) {
  const [value, setValue] = useAtom(props.newValueAtom);

  return asHTML(value).caseOf({
    Nothing() {
      return (
        <StyledWrongTypedValueContainer>
          <div>
            This value is not rich text. Use another editor, or{' '}
            <E.Button
              onClick={() => {
                setValue({
                  '@type': 'html',
                  value: String(value)
                });
              }}
            >
              convert this value to text
            </E.Button>
          </div>
        </StyledWrongTypedValueContainer>
      );
    },
    Just() {
      return <RichTextEditorInner {...props} />;
    }
  });
}

function classToolbarButton({ active }: { active: boolean }) {
  return clsx([
    active ? 'underline' : '',
    'font-semibold',
    'text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white'
  ]);
}

const StyledToolbarButton = classed.button(classToolbarButton);

function RichTextEditorInner(props: PropertyInputProps) {
  const [value, setValue] = useAtom(props.newValueAtom);

  const htmlValue =
    (isObject(value) &&
      !Array.isArray(value) &&
      ((value as JsonObject).value as string)) ||
    '';

  const editor = useEditor({
    autofocus: true,
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: true
      })
    ],
    editable: !props.readOnly,
    content: htmlValue,
    editorProps: {
      handleDrop: (_view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files) {
          throw new Error('Can’t upload files in play');
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setValue({
        '@type': 'html',
        value: html
      });
    }
  });

  return (
    <div className="relative" data-handle-drop>
      {editor && (
        <BubbleMenu
          className="flex rounded px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs gap-x-2"
          tippyOptions={{ duration: 100 }}
          editor={editor}
        >
          <StyledToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            Bold
          </StyledToolbarButton>
          <StyledToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            Italic
          </StyledToolbarButton>
          <StyledToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
          >
            Strike
          </StyledToolbarButton>
          <P.Root>
            <P.Trigger
              onClick={(e) => {
                if (editor.isActive('link')) {
                  editor
                    .chain()
                    .focus()
                    .toggleLink({
                      href: ''
                    })
                    .run();
                  e.preventDefault();
                }
              }}
              className={classToolbarButton({
                active: editor.isActive('link')
              })}
            >
              Link
            </P.Trigger>
            <E.PopoverContent2>
              <Formik<{ href: string }>
                onSubmit={(values) => {
                  editor
                    .chain()
                    .focus()
                    .toggleLink({
                      href: values.href
                    })
                    .run();
                }}
                initialValues={{ href: '' }}
              >
                <Form className="flex items-center gap-x-2">
                  <Field
                    autoFocus
                    className={E.inputClass({ _size: 'sm' })}
                    name="href"
                    required
                    type="url"
                    aria-label="URL"
                    placeholder="https://…"
                    spellCheck="false"
                    autoCapitalize="false"
                  />
                  <E.Button size="sm">Add</E.Button>
                </Form>
              </Formik>
            </E.PopoverContent2>
          </P.Root>
        </BubbleMenu>
      )}

      {editor && (
        <FloatingMenu
          className="flex rounded px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs gap-x-2"
          tippyOptions={{ duration: 100 }}
          editor={editor}
        >
          <StyledToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive('heading', { level: 1 })}
          >
            H1
          </StyledToolbarButton>
          <StyledToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive('heading', { level: 2 })}
          >
            H2
          </StyledToolbarButton>
          <StyledToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
          >
            Bullet list
          </StyledToolbarButton>
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function PropertyTextEditor(props: PropertyInputProps) {
  const [value, setValue] = useAtom(props.newValueAtom);

  if (isObject(value)) {
    return (
      <StyledWrongTypedValueContainer>
        <div>
          This value is complex and can’t be edited as text. Edit it in with the
          JSON editor, or{' '}
          <E.Button
            onClick={() => {
              setValue(JSON.stringify(value));
            }}
          >
            convert this value to text.
          </E.Button>
        </div>
      </StyledWrongTypedValueContainer>
    );
  }

  return (
    <div>
      <textarea
        className="block w-full
        text-sm
        h-64
        border-gray-300 dark:border-gray-600 rounded
        focus-visible:border-gray-300
        focus:ring-mb-blue-500
        dark:bg-gray-800 dark:text-white"
        value={String(value)}
        readOnly={props.readOnly}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

function PropertyJSONEditor(props: PropertyInputProps) {
  const [value, setValue] = useAtom(props.newValueAtom);
  const [error, setError] = useState<boolean>(false);

  return (
    <div className="relative">
      <SimpleText
        readOnly={props.readOnly}
        value={JSON.stringify(value, null, 2)}
        onChange={(val) => {
          parseOrError(val).caseOf({
            Left() {
              setError(true);
            },
            Right(value) {
              setValue(value);
              setError(false);
            }
          });
        }}
      />
      {error ? (
        <div
          className="opacity-100 hover:opacity-100 pointer-events-none
      bg-red-300/20 text-red-300 absolute top-2 right-2 rounded
      py-0.5 px-1
      text-xs"
        >
          Invalid JSON
        </div>
      ) : null}
    </div>
  );
}

function ValueNotOnThisFeature({ even }: { even: boolean }) {
  return (
    <T.Root delayDuration={300}>
      <T.Trigger className={triggerStyle(even)}>
        <QuestionMarkIcon />
      </T.Trigger>
      <E.TContent>
        <E.StyledTooltipArrow />
        <div className="w-48">
          This property exists in other features but not in this one: you can
          add it to this feature by entering a value.
        </div>
      </E.TContent>
    </T.Root>
  );
}

/**
 * Lets you select a given editor for a value.
 */
function PropertyValuePopover(props: PropertyInputProps) {
  const {
    onCast,
    pair: [key]
  } = props;
  const [value, setValue] = useAtom(props.newValueAtom);
  const [activeTab, setActiveTab] = useState<EditorTab>(guessTab(value));
  return (
    <div>
      <Tabs.Root
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as EditorTab)}
      >
        <Tabs.List className="flex items-center pb-2 gap-x-2">
          <StyledTabTrigger value={EditorTab.TEXT}>Text</StyledTabTrigger>
          <StyledTabTrigger value={EditorTab.RICH_TEXT}>
            Rich text
          </StyledTabTrigger>
          <StyledTabTrigger value={EditorTab.JSON}>JSON</StyledTabTrigger>
          <StyledTabTrigger value={EditorTab.COLOR}>Color</StyledTabTrigger>
        </Tabs.List>
        <Tabs.Content value="text">
          <PropertyTextEditor {...props} />
        </Tabs.Content>
        <Tabs.Content value="rich-text">
          <RichTextEditor {...props} />
        </Tabs.Content>
        <Tabs.Content value="json">
          <PropertyJSONEditor {...props} />
        </Tabs.Content>
        <Tabs.Content value="color">
          <ColorValueEditor {...props} />
        </Tabs.Content>
      </Tabs.Root>
      <div className="pt-3 text-xs flex items-stretch justify-start gap-x-2">
        {props.readOnly ? null : (
          <>
            <T.Root>
              <T.Trigger asChild>
                <E.Button
                  variant="destructive"
                  onClick={() => {
                    props.onDeleteKey(props.pair[0]);
                  }}
                >
                  <TrashIcon className="w-3 h-3" />
                </E.Button>
              </T.Trigger>
              <E.TContent side="bottom">Delete property</E.TContent>
            </T.Root>
            <div>
              <DD.Root>
                <DD.Trigger asChild>
                  <E.Button size="sm">
                    Type: {asSymbol(value as JsonValue)}
                    <UpdateIcon className="w-3 h-3" />
                  </E.Button>
                </DD.Trigger>
                <E.DDContent>
                  <E.StyledItem
                    onSelect={() => {
                      onCast(key, String(value), ExplicitCast.String);
                      setActiveTab(EditorTab.TEXT);
                    }}
                  >
                    String
                  </E.StyledItem>
                  <E.StyledItem
                    onSelect={() => {
                      onCast(key, String(value), ExplicitCast.JSON);
                      setActiveTab(EditorTab.JSON);
                    }}
                  >
                    JSON
                  </E.StyledItem>
                  <E.StyledItem
                    onSelect={() => {
                      setValue(castExplicit(value || 0, ExplicitCast.Boolean));
                      setActiveTab(EditorTab.JSON);
                    }}
                  >
                    True/False
                  </E.StyledItem>
                  <E.StyledItem
                    onSelect={() => {
                      setValue(castExplicit(value || 0, ExplicitCast.Number));
                      setActiveTab(EditorTab.JSON);
                    }}
                  >
                    Number
                  </E.StyledItem>
                </E.DDContent>
              </DD.Root>
            </div>
          </>
        )}
        <div className="flex-auto" />
        <P.Close asChild>
          <E.Button>
            <CheckIcon /> Done
          </E.Button>
        </P.Close>
      </div>
    </div>
  );
}

function PropertyRowMenu(props: PropertyInputProps) {
  const value = firstOrOnlyValue(props.pair[1]);

  return (
    <div className="flex items-center absolute top-1 bottom-1 right-1">
      {value === undefined ? (
        <ValueNotOnThisFeature even={props.even} />
      ) : (
        <T.Root>
          <T.Trigger asChild>
            <P.Trigger className={triggerStyle(props.even)}>
              <SizeIcon />
            </P.Trigger>
          </T.Trigger>
          <T.Portal>
            <E.TContent>
              <span className="whitespace-nowrap">Edit value</span>
              <E.TContent>
                <span className="whitespace-nowrap">Edit value</span>
              </E.TContent>
            </E.TContent>
          </T.Portal>
          <E.PopoverContent2 size="lg" sideOffset={-28}>
            <PropertyValuePopover {...props} />
          </E.PopoverContent2>
        </T.Root>
      )}
    </div>
  );
}

// EDITORS --------------------------------------------------------------------

/**
 * Edit a boolean value with a checkbox
 */
function BooleanEditor({
  pair,
  x,
  y,
  onChangeValue
}: {
  pair: PropertyPair;
  onChangeValue: OnChangeValue;
} & CoordProps) {
  return (
    <label
      {...coordPropsAttr({ x, y })}
      className="select-none block py-2 px-2 flex items-center gap-x-2 text-xs dark:text-white"
    >
      <input
        checked={Boolean(pair[1])}
        onChange={(e) => {
          onChangeValue(pair[0], e.target.checked);
        }}
        type="checkbox"
        className={E.styledCheckbox({ variant: 'default' })}
      />
      {pair[1] ? 'True' : 'False'}
    </label>
  );
}

/**
 * You can’t edit a JSON value inline. Instead, show a preview
 * and trigger the popover when it is clicked.
 */
function PropertyJSONPreview({
  value,
  x,
  y
}: {
  value: JsonValue | undefined;
  readOnly?: boolean;
} & CoordProps) {
  const preview: Preview = useMemo(() => {
    return asHTML(value)
      .map((value): Preview => {
        return {
          kind: 'html',
          value: String(value.value).slice(0, 100)
        };
      })
      .orDefaultLazy((): Preview => {
        return {
          kind: 'code',
          value: JSON.stringify(value).slice(0, 100)
        };
      });
  }, [value]);
  return (
    <P.Trigger
      aria-label="Edit JSON property"
      className={`h-8
      ${preview.kind === 'html' ? '' : 'font-mono'}
      text-left text-xs
      truncate
      block w-full dark:bg-transparent
      focus-visible:ring-inset
      focus-visible:ring-1 focus-visible:ring-mb-blue-500
      truncate text-gray-900 dark:text-gray-100`}
      {...coordPropsAttr({ x, y })}
    >
      <div className="truncate absolute top-0 bottom-0 left-2 right-0 flex items-center">
        {preview.value || <span className="opacity-0">|</span>}
      </div>
    </P.Trigger>
  );
}

/**
 * Edit a text value with a text input
 *
 * PropertyRowValue -> TextEditor
 */
function TextEditor({
  pair,
  x,
  y,
  table = false,
  onChangeValue,
  readOnly = false
}: {
  pair: PropertyPair;
  table: boolean;
  onChangeValue: OnChangeValue;
  readOnly?: boolean;
} & CoordProps) {
  const { featureMap } = useAtomValue(dataAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState<boolean>(false);

  const [key, value] = pair;
  const valueProps = useResettable({
    value: value === undefined ? '' : value === null ? 'null' : String(value),
    onCommit(value) {
      onChangeValue(key, value);
    },
    onBlur() {
      setDirty(false);
    },
    onChange() {
      setDirty(true);
    }
  });

  const isEmpty = value === undefined || value === '';

  // Optimization: only compute props that we might show
  const enableProperties = dirty || isEmpty;

  const topProperties = useMemo(() => {
    if (inputRef.current !== document.activeElement) return [];
    if (!enableProperties) return [];

    const [key] = pair;
    const counts = new Map<string | number, number>();

    const currentValue = valueProps.value;

    for (const { feature } of featureMap.values()) {
      const value = feature.properties?.[key];
      if (
        value !== currentValue &&
        value !== '' &&
        (typeof value === 'string' || typeof value === 'number')
      ) {
        if (
          !currentValue ||
          String(value)
            .toLowerCase()
            .includes(String(currentValue).toLowerCase())
        ) {
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      }
    }

    const head = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map((a) => a[0]);

    return head;
  }, [pair, valueProps.value, featureMap, enableProperties]);

  const showOptions = enableProperties && topProperties.length > 0;

  return (
    <P.Root open={showOptions}>
      <P.Anchor asChild>
        <input
          spellCheck="false"
          type="text"
          {...coordPropsAttr({ x, y })}
          className={E.styledPropertyInput(table ? 'table' : 'right')}
          aria-label={`Value for: ${key}`}
          readOnly={readOnly}
          {...valueProps}
          ref={inputRef}
        />
      </P.Anchor>
      <P.Portal>
        <E.StyledPopoverContent
          size="xs"
          flush="yes"
          side="bottom"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className="overflow-y-auto divide-y
            divide-gray-200 dark:divide-gray-900
            geojsonio-scrollbar w-full text-xs rounded-md"
            style={{
              maxHeight: 100
            }}
          >
            {topProperties.map((value, i) => {
              return (
                <button
                  type="button"
                  className="block w-full text-left truncate py-1 px-2
                    bg-gray-100 dark:bg-gray-700
                    opacity-75 hover:opacity-100"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChangeValue(pair[0], value);
                  }}
                  key={i}
                  title={String(value)}
                >
                  {truncate(String(value), 24)}
                </button>
              );
            })}
          </div>
        </E.StyledPopoverContent>
      </P.Portal>
    </P.Root>
  );
}

/**
 * The "value" part of a property
 */
export function PropertyRowValue({
  pair,
  onChangeValue,
  onDeleteKey,
  onFocus = noop,
  /**
   * Whether this value is in a table
   */
  table = false,
  even,
  onCast,
  readOnly = false,
  x,
  y
}: {
  pair: PropertyPair;
  onChangeValue: OnChangeValue;
  onDeleteKey: OnDeleteKey;
  onFocus?: () => void;
  table?: boolean;
  readOnly?: boolean;
  even: boolean;
  onCast: OnCast;
} & CoordProps) {
  // Some of the editors don’t change values
  // immediately, like the color picker. So
  // we create a sort of "transient" value here.
  const [key, value] = pair;
  const newValueAtom: NewValueAtom = useMemo(() => atom(value), [value]);
  const newValue = useAtomValue(newValueAtom);

  return (
    <div onFocus={onFocus} className="relative group-1">
      <P.Root
        onOpenChange={(open) => {
          if (!open) {
            onChangeValue(key, newValue!);
          }
        }}
      >
        {isObject(value) ? (
          <PropertyJSONPreview value={value} x={x} y={y} readOnly={readOnly} />
        ) : typeof value === 'boolean' ? (
          <BooleanEditor
            pair={pair}
            onChangeValue={onChangeValue}
            x={x}
            y={y}
          />
        ) : (
          <TextEditor
            table={table}
            pair={pair}
            onChangeValue={onChangeValue}
            readOnly={readOnly}
            x={x}
            y={y}
          />
        )}
        <PropertyRowMenu
          readOnly={readOnly}
          onDeleteKey={onDeleteKey}
          onCast={onCast}
          even={even}
          pair={pair}
          newValueAtom={newValueAtom}
        />
      </P.Root>
    </div>
  );
}
