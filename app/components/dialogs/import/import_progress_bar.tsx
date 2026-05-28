import type { Progress } from 'app/lib/convert';
import classed from 'classed-components';
import { Progress as ProgressPrimitive } from 'radix-ui';

const StyledProgress = classed(ProgressPrimitive.Root)(
  `relative h-2 rounded-full overflow-hidden bg-gray-100`
);

const StyledIndicator = classed(ProgressPrimitive.Indicator)(
  `bg-mb-blue-300 h-2 w-100 transition-transform`
);

export function ImportProgressBar({ progress }: { progress: Progress | null }) {
  return progress ? (
    <div className="pt-4">
      <StyledProgress value={progress.done} max={progress.total}>
        <StyledIndicator
          style={{
            transform: `translateX(-${~~(
              (1 - progress.done / progress.total) *
              100
            )}%)`
          }}
        />
      </StyledProgress>
      <div className="text-center text-xs pt-2">
        {progress.done} / {progress.total}
      </div>
    </div>
  ) : null;
}
