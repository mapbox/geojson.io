import type { Geometry, IWrappedFeature } from 'types';

interface Stat {
  min: number | null;
  max: number | null;
  strings: Map<string, number>;
  sum: number;
  types: {
    number: number;
    string: number;
    boolean: number;
    other: number;
  };
}

function emptyStat(): Stat {
  return {
    min: null,
    max: null,
    strings: new Map(),
    sum: 0,
    types: {
      number: 0,
      string: 0,
      boolean: 0,
      other: 0
    }
  };
}

export type RetStat = ReturnType<typeof collectStatistics>[0]['stats'];

export function collectGeometryCounts(features: IWrappedFeature[]) {
  const counts: Record<Geometry['type'] | 'null', number> = {
    Point: 0,
    MultiPoint: 0,
    Polygon: 0,
    MultiPolygon: 0,
    LineString: 0,
    MultiLineString: 0,
    GeometryCollection: 0,
    null: 0
  };

  for (const { feature } of features) {
    const type = feature.geometry?.type;
    if (type) {
      counts[type]++;
    } else {
      counts.null++;
    }
  }
  return counts;
}

export function collectStatistics(features: IWrappedFeature[]) {
  const stats = new Map<string, Stat>();

  for (const { feature } of features) {
    if (!feature.properties) continue;
    for (const [property, value] of Object.entries(feature.properties)) {
      let stat = stats.get(property);

      if (!stat) {
        stat = emptyStat();
        stats.set(property, stat);
      }

      switch (typeof value) {
        case 'number': {
          if (stat.min === null || value < stat.min) stat.min = value;
          if (stat.max === null || value > stat.max) stat.max = value;
          stat.sum += value;
          stat.types.number++;
          break;
        }
        case 'string': {
          stat.strings.set(value, (stat.strings.get(value) || 0) + 1);
          stat.types.string++;
          break;
        }
        case 'boolean': {
          stat.types.boolean++;
          break;
        }
        default: {
          stat.types.other++;
          break;
        }
      }
    }
  }

  return Array.from(stats.entries(), ([property, stats]) => {
    return {
      property,
      stats: {
        ...stats,
        strings: Array.from(stats.strings.entries()).sort((a, b) => b[1] - a[1])
      }
    };
  }).sort((a, b) => (a.property > b.property ? -1 : 1));
}
