import type { PersistenceMetadataMemory } from 'app/lib/persistence/ipersistence';
import { Popover as P } from 'radix-ui';

export function MemoryInfo({
  metadata: _metadata
}: {
  metadata: PersistenceMetadataMemory;
}) {
  return (
    <P.Root>
      <P.Trigger className="flex items-center self-center text-xs justify-self-center">
        <div className="justify-self-center text-sm text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center">
          Draft
        </div>
      </P.Trigger>
    </P.Root>
  );
}
