import { DownloadIcon } from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import {
  Button,
  styledInlineA,
  styledTextarea,
  TextWell
} from 'app/components/elements';
import { asColorExpression } from 'app/lib/load_and_augment_style';
import { usePersistence } from 'app/lib/persistence/context';
import type { ISymbolization } from 'types';

function CopySymbolization({
  symbolization
}: {
  symbolization: ISymbolization;
}) {
  return (
    <div>
      <textarea
        className={styledTextarea}
        rows={10}
        value={JSON.stringify(asColorExpression({ symbolization }), null, 2)}
      />
      <TextWell>
        This code can be used as a{' '}
        <a
          href="https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/"
          target="_blank"
          className={styledInlineA}
          rel="nofollow noreferrer"
        >
          Mapbox GL Style Expression
        </a>
        , in a raw JSON style for Mapbox GL or Maplibre.
      </TextWell>
    </div>
  );
}

export function ExportCodeDialog({ onClose }: { onClose: () => void }) {
  const rep = usePersistence();
  const [meta] = rep.useMetadata();
  const { symbolization } = meta;
  return (
    <>
      <DialogHeader title="Export style expression" titleIcon={DownloadIcon} />
      {symbolization ? (
        <CopySymbolization symbolization={symbolization} />
      ) : (
        <div>There is no symbolization to copy for this feature.</div>
      )}

      <div className="pt-6 pb-1 flex flex-col sm:flex-row-reverse space-y-2 sm:space-y-0 sm:gap-x-3">
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );
}
