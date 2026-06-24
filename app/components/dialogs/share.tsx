import {
  Share2Icon,
  CopyIcon,
  ExclamationTriangleIcon
} from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import * as E from 'app/components/elements';
import { gzipEncode } from 'app/lib/url_encoding';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { dataAtom } from 'state/jotai';
import type { FeatureMap } from 'types';
import { UWrappedFeature } from 'types';

const WARN_LENGTH = 2000;
const MAX_URL_LENGTH = 8000;

export async function buildShareUrl(featureMap: FeatureMap): Promise<{
  url: string;
  tooLong: boolean;
  longWarning: boolean;
}> {
  const fc = UWrappedFeature.mapToFeatureCollection(featureMap);
  const json = JSON.stringify(fc);
  const encoded = await gzipEncode(json);
  const url = `${window.location.origin}/?data=gz:${encoded}`;
  return {
    url,
    tooLong: url.length >= MAX_URL_LENGTH,
    longWarning: url.length >= WARN_LENGTH && url.length < MAX_URL_LENGTH
  };
}

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const data = useAtomValue(dataAtom);
  const [result, setResult] = useState<{
    url: string;
    tooLong: boolean;
    longWarning: boolean;
  } | null>(null);

  useEffect(() => {
    buildShareUrl(data.featureMap).then(setResult);
  }, [data.featureMap]);

  async function copyUrl() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    toast.success('Copied link');
  }

  return (
    <>
      <DialogHeader title="Share" titleIcon={Share2Icon} />
      <div className="space-y-4">
        {!result ? (
          <E.TextWell>Generating link…</E.TextWell>
        ) : result.tooLong ? (
          <E.TextWell variant="destructive">
            The current dataset is too large to share via URL. Share links are
            limited to {MAX_URL_LENGTH.toLocaleString()} characters. Try
            reducing the number of features or simplifying geometry.
          </E.TextWell>
        ) : (
          <>
            <E.TextWell>
              Share this link to load the current data in geojson.io. The data
              is encoded directly in the URL — no account or upload required.
            </E.TextWell>
            {result.longWarning && (
              <div className="text-sm py-2 px-3 rounded bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
                <ExclamationTriangleIcon className="inline-block w-3 h-3 mr-1" />
                This URL is over {WARN_LENGTH.toLocaleString()} characters. Very
                long URLs may not work in all browsers or apps.
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={result.url}
                className="flex-1 text-xs font-mono bg-gray-100 dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  rounded px-2 py-1.5 text-gray-800 dark:text-gray-200
                  focus:outline-none"
                onFocus={(e) => e.target.select()}
              />
              <E.Button size="xs" onClick={copyUrl} aria-label="Copy URL">
                <CopyIcon className="w-3 h-3" />
                Copy
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
