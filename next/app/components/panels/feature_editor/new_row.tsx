import { PlusIcon } from '@radix-ui/react-icons';
import { styledPropertyInput, styledTd } from 'app/components/elements';
import { useRef, useState } from 'react';
import { coordPropsAttr } from './property_row/value';

export function NewRow({
  onCommit,
  y
}: {
  onCommit: (key: string, value: string) => void;
  y: number;
}) {
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const keyRef = useRef<HTMLInputElement | null>(null);

  function commit(newKey: string, newValue: string) {
    onCommit(newKey, newValue);
    setNewKey('');
    setNewValue('');
    keyRef.current?.focus();
  }

  function maybeCommit() {
    if (newKey && newValue) {
      commit(newKey, newValue);
    }
  }

  function onKeyUp(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        break;
      case 'Enter':
        maybeCommit();
        break;
    }
  }

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target !== e.currentTarget) return;
    maybeCommit();
  };

  return (
    <tr>
      <td className={`border-r border-b border-t ${styledTd}`}>
        <input
          ref={keyRef}
          type="text"
          className={styledPropertyInput('left')}
          aria-label="New key"
          placeholder="New key"
          spellCheck="false"
          value={newKey}
          onChange={(e) => setNewKey(e.currentTarget.value)}
          onKeyUp={onKeyUp}
          onBlur={onBlur}
          {...coordPropsAttr({ x: 0, y })}
        />
      </td>
      <td className={`border-l border-b border-t ${styledTd} relative`}>
        <input
          type="text"
          className={styledPropertyInput('right')}
          aria-label="New value"
          placeholder="New value"
          value={newValue}
          onChange={(e) => setNewValue(e.currentTarget.value)}
          onKeyUp={onKeyUp}
          onBlur={onBlur}
          {...coordPropsAttr({ x: 1, y })}
        />
        <div className="flex items-center absolute top-1 bottom-1 right-1">
          <button
            type="button"
            aria-label="Save property"
            onClick={() => commit(newKey, newValue)}
            className="text-gray-500 focus:text-gray-700 hover:text-black
              dark:hover:text-white dark:focus:text-white p-1"
          >
            <PlusIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}
