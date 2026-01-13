import { Cross1Icon } from '@radix-ui/react-icons';
import type { IconProps } from '@radix-ui/react-icons/dist/types';
import { Dialog as D } from 'radix-ui';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type SlottableIcon =
  | React.FC<React.ComponentProps<'svg'>>
  | ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

export function DialogHeader({
  title,
  titleIcon: TitleIcon
}: {
  title: string;
  titleIcon: SlottableIcon;
}) {
  return (
    <div
      className="flex items-center justify-between
        gap-x-2
        pb-4 text-lg
        text-black dark:text-white"
    >
      <TitleIcon />
      <div className="truncate flex-auto">{title}</div>
      <D.Close
        aria-label="Close"
        className="text-gray-500 shrink-0
                  focus:bg-gray-200 dark:focus:bg-black
                  hover:text-black dark:hover:text-white"
      >
        <Cross1Icon />
      </D.Close>
    </div>
  );
}
