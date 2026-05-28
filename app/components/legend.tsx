import { GearIcon, Pencil2Icon } from '@radix-ui/react-icons';
import { MapContext } from 'app/context/map_context';
import { linearGradient } from 'app/lib/color';
import { SCALE_UNITS, type ScaleUnit, zScaleUnit } from 'app/lib/constants';
import { usePersistence } from 'app/lib/persistence/context';
import { useAtom, useSetAtom } from 'jotai';
import last from 'lodash/last';
import throttle from 'lodash/throttle';
import { Popover as P } from 'radix-ui';
import {
  Fragment,
  useContext,
  useEffect,
  useState,
  useTransition
} from 'react';
import { scaleUnitAtom, TabOption, tabAtom } from 'state/jotai';
import { match } from 'ts-pattern';
import type { ISymbolizationCategorical, ISymbolizationRamp } from 'types';
import {
  Button,
  StyledLabelSpan,
  StyledPopoverArrow,
  StyledPopoverContent,
  styledSelect
} from './elements';

interface ScaleMeasurement {
  unit: string;
  maxDistance: number;
}

function LegendTitle({ title }: { title: string }) {
  const setTab = useSetAtom(tabAtom);
  return (
    <div className="block w-full px-2 pt-2 text-right flex justify-between items-center">
      {title}
      <Button
        variant="quiet"
        aria-label="Edit symbolization"
        onClick={() => {
          setTab(TabOption.Symbolization);
        }}
      >
        <Pencil2Icon className="w-3 h-3" />
      </Button>
    </div>
  );
}

function LegendContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="space-y-1 text-xs
      bg-white dark:bg-gray-900
      dark:text-white
      border border-gray-300 dark:border-black w-48 rounded-t"
    >
      {children}
    </div>
  );
}

function LegendRamp({ symbolization }: { symbolization: ISymbolizationRamp }) {
  return (
    <>
      <LegendTitle title={symbolization.property} />
      <div className="p-2">
        <div
          className="h-4 rounded dark:border dark:border-white"
          style={{
            background: linearGradient({
              colors: symbolization.stops.map((stop) => stop.output),
              interpolate: symbolization.interpolate
            })
          }}
        />
        <div className="flex justify-between pt-1">
          <div className="truncate">{symbolization.stops[0]?.input}</div>
          <div className="truncate">{last(symbolization.stops)?.input}</div>
        </div>
      </div>
    </>
  );
}

function LegendCategorical({
  symbolization
}: {
  symbolization: ISymbolizationCategorical;
}) {
  return (
    <>
      <LegendTitle title={symbolization.property} />
      <div className="p-2">
        <div
          className="grid gap-x-1"
          style={{
            gridTemplateColumns: '12px 1fr',
            gridRowGap: '1px'
          }}
        >
          {symbolization.stops.map((stop, i) => {
            return (
              <Fragment key={i}>
                <div
                  className={`dark:border dark:border-gray-300/40 rounded-sm`}
                  style={{
                    background: stop.output
                  }}
                />
                <div title={String(stop.input)} className="truncate">
                  {stop.input}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}

function getScale(
  map: mapboxgl.Map,
  options: {
    unit: ScaleUnit;
  }
): {
  maxDistance: number;
  unit: string;
} {
  // A horizontal scale is imagined to be present at center of the map
  // container with maximum length (Default) as 100px.
  // Using spherical law of cosines approximation, the real distance is
  // found between the two coordinates.
  const maxWidth = MAX_WIDTH;

  // These are "internal" so we have to cast to any.
  const y = (map as any)._containerHeight / 2;
  const x = (map as any)._containerWidth / 2 - maxWidth / 2;
  const left = map.unproject([x, y]);
  const right = map.unproject([x + maxWidth, y]);
  const maxMeters = left.distanceTo(right);
  // The real distance corresponding to 100px scale length is rounded off to
  // near pretty number and the scale length for the same is found out.
  // Default unit of the scale is based on User's locale.
  if (options.unit === 'imperial') {
    const maxFeet = 3.2808 * maxMeters;
    if (maxFeet > 5280) {
      const maxMiles = maxFeet / 5280;
      return { maxDistance: maxMiles, unit: 'mile' };
    } else {
      return { maxDistance: maxFeet, unit: 'foot' };
    }
  } else if (options.unit === 'nautical') {
    const maxNauticals = maxMeters / 1852;
    return { maxDistance: maxNauticals, unit: 'nautical-mile' };
  } else if (maxMeters >= 1000) {
    return { maxDistance: maxMeters / 1000, unit: 'kilometer' };
  } else {
    return { maxDistance: maxMeters, unit: 'meter' };
  }
}

function getDecimalRoundNum(d: number) {
  const multiplier = 10 ** Math.ceil(-Math.log(d) / Math.LN10);
  return Math.round(d * multiplier) / multiplier;
}

function getRoundNum(num: number) {
  const pow10 = 10 ** (`${Math.floor(num)}`.length - 1);
  let d = num / pow10;

  d =
    d >= 10
      ? 10
      : d >= 5
      ? 5
      : d >= 3
      ? 3
      : d >= 2
      ? 2
      : d >= 1
      ? 1
      : getDecimalRoundNum(d);

  return pow10 * d;
}

const MAX_WIDTH = 150;

function ScaleControl() {
  const map = useContext(MapContext);
  const [, startTransition] = useTransition();
  const [scaleUnit, setScaleUnit] = useAtom(scaleUnitAtom);
  const [{ unit, maxDistance }, setMeasurement] = useState<ScaleMeasurement>({
    maxDistance: 1,
    unit: 'mile'
  });

  useEffect(() => {
    if (map) {
      const onMove = throttle((e: mapboxgl.MapboxEvent) => {
        startTransition(() => {
          setMeasurement(
            getScale(e.target, {
              unit: scaleUnit
            })
          );
        });
      }, 50);
      map.map.on('move', onMove);
      setMeasurement(
        getScale(map.map, {
          unit: scaleUnit
        })
      );
      return () => {
        if (map) {
          map.map.off('move', onMove);
        }
      };
    }
  }, [map, scaleUnit]);

  const distance = getRoundNum(maxDistance);
  const ratio = distance / maxDistance;

  const label =
    unit === 'nautical-mile'
      ? `${distance}nm`
      : new Intl.NumberFormat('en-us', {
          style: 'unit',
          unitDisplay: 'narrow',
          unit
        }).format(distance);

  const white = `rgba(255, 255, 255, 0.3)`;

  return (
    <P.Root>
      <div className="group flex items-center">
        <div className="flex-auto">
          <div
            className="border-l-2 border-r-2 border-b-2 border-mb-blue-500"
            style={{
              width: MAX_WIDTH * ratio,
              height: 5,
              boxShadow: `
                -1px 0 ${white},
                1px 0 ${white},
                0 1px ${white}
                `
            }}
          />
          <div
            className="text-xs pt-0.5 text-black"
            style={{
              textShadow: `
          -1px 0 ${white},
          0 1px ${white},
          1px 1px ${white},
          -1px -1px ${white},
          1px -1px ${white},
          -1px 1px ${white},
          1px 0 ${white},
          0 -1px ${white}`
            }}
          >
            {label}
          </div>
        </div>
        <P.Trigger className="opacity-10 group-hover:opacity-100 p-1 rounded group-hover:bg-white">
          <GearIcon />
        </P.Trigger>
        <StyledPopoverContent size="xs">
          <StyledPopoverArrow />
          <label className="block space-y-1">
            <div>
              <StyledLabelSpan>Units</StyledLabelSpan>
            </div>
            <select
              className={styledSelect({ size: 'sm' })}
              value={scaleUnit}
              onChange={(e) => {
                const data = zScaleUnit.safeParse(e.target.value);
                if (data.success) {
                  setScaleUnit(data.data);
                }
              }}
            >
              {SCALE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
        </StyledPopoverContent>
      </div>
    </P.Root>
  );
}

export function Legend() {
  const rep = usePersistence();
  const [meta] = rep.useMetadata();
  const { symbolization } = meta;

  if (!symbolization) return null;

  const legend = match(symbolization)
    .with({ type: 'none' }, () => null)
    .with({ type: 'categorical' }, (symbolization) => (
      <LegendCategorical symbolization={symbolization} />
    ))
    .with({ type: 'ramp' }, (symbolization) => (
      <LegendRamp symbolization={symbolization} />
    ))
    .exhaustive();

  return (
    <div className="space-y-1 absolute bottom-0 right-10 w-48">
      <ScaleControl />
      <LegendContainer>{legend}</LegendContainer>
    </div>
  );
}
