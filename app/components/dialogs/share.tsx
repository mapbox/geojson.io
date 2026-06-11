import { Share2Icon, CopyIcon, CheckIcon } from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import * as E from 'app/components/elements';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { dataAtom } from 'state/jotai';
import type { FeatureMap } from 'types';
import { UWrappedFeature } from 'types';

export function buildShareUrl(featureMap: FeatureMap): {
  url: string;
  tooLong: boolean;
} {
  const fc = UWrappedFeature.mapToFeatureCollection(featureMap);
  const json = JSON.stringify(fc);
  const dataUri = `data:application/json,${encodeURIComponent(json)}`;
  const url = `${window.location.origin}/?data=${encodeURIComponent(dataUri)}`;
  return { url, tooLong: url.length >= 2000 };
}

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const data = useAtomValue(dataAtom);
  const [copied, setCopied] = useState(false);

  const { url, tooLong } = buildShareUrl(data.featureMap);

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <DialogHeader title="Share" titleIcon={Share2Icon} />
      <div className="space-y-4">
        {tooLong ? (
          <E.TextWell variant="destructive">
            The current dataset is too large to share via URL. Share links are
            limited to 2000 characters. Try reducing the number of features or
            simplifying geometry.
          </E.TextWell>
        ) : (
          <>
            <E.TextWell>
              Share this link to load the current data in geojson.io. The data
              is encoded directly in the URL — no account or upload required.
            </E.TextWell>
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={url}
                className="flex-1 text-xs font-mono bg-gray-100 dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  rounded px-2 py-1.5 text-gray-800 dark:text-gray-200
                  focus:outline-none"
                onFocus={(e) => e.target.select()}
              />
              <E.Button
                variant="quiet"
                size="sm"
                onClick={copyUrl}
                aria-label="Copy URL"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </E.Button>
            </div>
          </>
        )}
        <div className="pt-6 pb-1 flex justify-end">
          <E.Button type="button" onClick={onClose}>
            Close
          </E.Button>
        </div>
      </div>
    </>
  );
}
