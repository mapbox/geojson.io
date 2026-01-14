import { FileIcon } from '@radix-ui/react-icons';
import { truncate } from 'app/lib/utils';
import { useAtom, useAtomValue } from 'jotai';
import { Popover } from 'radix-ui';
import { fileInfoAtom, fileInfoMachineAtom } from 'state/jotai';
import { StyledPopoverArrow, StyledPopoverContent } from './elements';

export function FileInfo() {
  const fileInfo = useAtomValue(fileInfoAtom);
  const [state] = useAtom(fileInfoMachineAtom);

  if (!fileInfo) return <div></div>;

  return (
    <Popover.Root open={state.matches('visible')}>
      <div className="pl-3 flex-initial hidden sm:flex items-center gap-x-1">
        <Popover.Anchor>
          <FileIcon className="w-3 h-3" />
        </Popover.Anchor>
        <div
          className="text-xs font-mono whitespace-nowrap truncate"
          title={`Saving as ${fileInfo.handle.name}`}
        >
          {truncate(fileInfo.handle.name, 18)}
        </div>
      </div>
      <StyledPopoverContent size="xs">
        <StyledPopoverArrow />
        <div className="text-xs">Saved</div>
      </StyledPopoverContent>
    </Popover.Root>
  );
}
