import { useHotkeys } from 'integrations/hotkeys';
import { Tooltip } from 'radix-ui';
import { Button, Keycap, TContent } from './elements';

export default function MenuAction({
  selected = false,
  onClick,
  children,
  disabled = false,
  role = undefined,
  label,
  hotkey,
  noShift = false
}: {
  selected?: boolean;
  onClick: (e?: Pick<React.MouseEvent, 'shiftKey'>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  role?: React.HTMLAttributes<HTMLButtonElement>['role'];
  label: string;
  hotkey?: string;
  /**
   * If this menu action already has a shifted version
   * and shouldn't get an automatic 'shift' edition.
   */
  noShift?: boolean;
}) {
  useHotkeys(
    `Shift+${hotkey || ''}`,
    (e) => {
      e.preventDefault();
      onClick({
        shiftKey: true
      });
    },
    {
      enabled: !!hotkey && !noShift
    },
    [onClick]
  );

  useHotkeys(
    hotkey || 'noop',
    (e) => {
      e.preventDefault();
      onClick();
    },
    {
      enabled: !!hotkey
    },
    [onClick]
  );

  return (
    <div className="relative">
      <Tooltip.Root>
        <div
          className={`h-10 w-8 ${
            disabled ? 'opacity-50' : ''
          } group bn flex items-stretch py-1 focus:outline-none`}
        >
          <Tooltip.Trigger asChild>
            <Button
              onClick={onClick}
              variant="quiet/mode"
              role={role}
              disabled={disabled}
              aria-label={label}
              aria-checked={selected}
              aria-expanded={selected ? 'true' : 'false'}
            >
              {children}
            </Button>
          </Tooltip.Trigger>
        </div>

        <TContent side="bottom">
          <div className="flex gap-x-2 items-center">
            {label}
            {hotkey ? <Keycap size="xs">{hotkey}</Keycap> : null}
          </div>
        </TContent>
      </Tooltip.Root>
    </div>
  );
}
