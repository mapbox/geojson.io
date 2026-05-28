import { Combobox } from '@headlessui/react';
import {
  GlobeIcon,
  GroupIcon,
  MagnifyingGlassIcon,
  SewingPinIcon
} from '@radix-ui/react-icons';
import { Folder16 } from 'app/components/icons';
import type { QItem } from 'app/lib/geocode';
import { truncate } from 'app/lib/utils';
import type { FuseResultMatch } from 'fuse.js';
import { match } from 'ts-pattern';

export const comboboxInputClass = `px-4 py-3
          text-black dark:text-white
          block w-full
          text-lg
          bg-gray-100 dark:bg-gray-900
          border-none
          ring-0`;

export const comboboxFooterClass = `bg-gray-200 dark:bg-gray-800
      p-2 flex items-center gap-x-1 text-xs
      text-gray-700 dark:text-gray-200 w-full`;

function QItemDisplay({ item, active }: { item: QItem; active: boolean }) {
  const content = match(item)
    .with({ type: 'Feature' }, (item) => (
      <>
        <MagnifyingGlassIcon className="opacity-30" />
        <div className="truncate">{item.properties.label}</div>
      </>
    ))
    .with({ type: 'geocoder' }, (item) => {
      const split = item.properties.label.split(' - ');
      return (
        <>
          <MagnifyingGlassIcon className="opacity-30" />
          <div className="truncate">
            {split.length > 1 ? (
              <>
                <span className="font-bold">{split[0]}</span> - {split[1]}
              </>
            ) : (
              <span className="font-bold">{item.properties.label}</span>
            )}
          </div>
        </>
      );
    })
    .with({ type: 'extent' }, (item) => (
      <>
        <GroupIcon className="opacity-30" />
        Pan to {item.name}
      </>
    ))
    .with({ type: 'coordinate' }, (item) => (
      <>
        <SewingPinIcon className="opacity-30" />
        Pan to {item.name}
      </>
    ))
    .with({ type: 'action' }, (item) => {
      return (
        <>
          {item.action.icon}
          <div className="truncate">{item.action.label}</div>
        </>
      );
    })
    .with({ type: 'wrappedFeature' }, (item) => {
      return (
        <>
          <SewingPinIcon className="opacity-30" />
          <div className="truncate">
            {item.result.item.feature.geometry?.type || ''} feature
            {formatMatches(item.result.matches)}
          </div>
        </>
      );
    })
    .with({ type: 'leaf' }, (item) => {
      return (
        <>
          <GlobeIcon className="opacity-30" />
          {item.data.name}
        </>
      );
    })
    .with({ type: 'container' }, (item) => (
      <>
        <Folder16 className="opacity-30" />
        {item.data.name}
      </>
    ))
    .exhaustive();

  return (
    <div
      className={`
                px-3 py-2
                text-sm text-left
                dark:text-gray-50
                cursor-pointer
                grid gap-x-1 items-center
                text-black dark:text-white ${
                  active
                    ? 'bg-purple-200 dark:bg-purple-400 dark:text-black'
                    : 'hover:bg-purple-200 dark:hover:bg-purple-400 dark:hover:text-black'
                }`}
      style={{
        gridTemplateColumns: '1rem auto'
      }}
    >
      {content}
    </div>
  );
}

export function ResultsOptions({
  results,
  title
}: {
  results: QItem[];
  title: string;
}) {
  if (!results.length) return null;
  return (
    <>
      <div
        style={{
          fontSize: 10
        }}
        className="uppercase text-gray-500 pl-4 pt-2"
      >
        {title}
      </div>
      {results.map((item, i) => (
        <Combobox.Option value={item} key={i}>
          {({ active }) => {
            return <QItemDisplay item={item} active={active} />;
          }}
        </Combobox.Option>
      ))}
    </>
  );
}

/**
 * Fuse provides "matches" which are represented as a key and value, which
 * is the match.
 * If we have one, format it. Otherwise null.
 */
function formatMatches(matches: readonly FuseResultMatch[] | undefined) {
  if (!matches?.length) return null;
  const match = matches[0];
  return (
    <span>
      {' '}
      with{' '}
      <span className="font-mono">
        {truncate(match.key || '', 64)}: {truncate(match.value || '', 64)}
      </span>
    </span>
  );
}
