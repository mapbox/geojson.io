import noop from 'lodash/noop';
import { useEffect, useState } from 'react';

export default function useResettable({
  value,
  onCommit,
  onBlur = noop,
  onChange = noop
}: {
  value: string;
  onCommit: (value: string) => void;
  onBlur?: () => void;
  onChange?: () => void;
}) {
  const [newValue, setNewValue] = useState<string>(value);

  useEffect(() => {
    setNewValue(value);
  }, [value]);

  return {
    onKeyUp(e: React.KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          setNewValue(value);
          break;
        case 'Enter':
          onCommit(newValue);
          break;
      }
    },
    onBlur(e: React.FocusEvent) {
      onBlur();
      if (e.target === e.currentTarget && newValue !== value) {
        onCommit(newValue);
      }
    },
    value: newValue,
    onChange(e: React.ChangeEvent<HTMLInputElement>) {
      setNewValue(e.currentTarget.value);
      onChange();
    }
  };
}
