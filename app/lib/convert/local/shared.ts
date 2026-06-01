import { polylineToGeoJSON } from '@placemarkio/polyline';
import { parseOrError } from 'app/lib/errors';
import { rough } from 'app/lib/roughly_geojson';
import { wktToGeoJSON } from 'betterknown';
import type { Unzipped } from 'fflate';
import { Either } from 'purify-ts/Either';
import { Maybe } from 'purify-ts/Maybe';
import type { JsonObject, JsonValue } from 'type-fest';
import type { Feature } from 'types';
import { z } from 'zod';

export async function unzip(file: ArrayBuffer) {
  const fflate = await import('fflate');
  return await new Promise<Unzipped>((resolve, reject) => {
    fflate.unzip(new Uint8Array(file), (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

export const EnforcedWKTOptions = z.object({
  geometryHeader: z.string()
});

export const EnforcedLonLatOptions = z.object({
  latitudeHeader: z.string(),
  longitudeHeader: z.string(),
  autoType: z.boolean()
});

function safeParse(value: JsonValue | undefined) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  return parseFloat(value);
}

export function castRowWKT(
  parsedRow: JsonObject,
  options: z.infer<typeof EnforcedWKTOptions>
): Feature | null {
  const { geometryHeader } = options;
  // Numbers.app doesn't prune columns without headers.
  delete parsedRow[''];

  return Maybe.fromNullable(
    wktToGeoJSON(String(parsedRow[geometryHeader]))
  ).mapOrDefault((geometry): Feature => {
    delete parsedRow[geometryHeader];
    return {
      type: 'Feature',
      properties: parsedRow,
      geometry
    };
  }, null);
}

export function castRowPolyline(
  parsedRow: JsonObject,
  options: z.infer<typeof EnforcedWKTOptions>
): Feature | null {
  const { geometryHeader } = options;
  // Numbers.app doesn't prune columns without headers.
  delete parsedRow[''];

  return Either.encase(() =>
    polylineToGeoJSON(String(parsedRow[geometryHeader]))
  ).caseOf({
    Left() {
      return null;
    },
    Right(geometry): Feature {
      delete parsedRow[geometryHeader];
      return {
        type: 'Feature',
        properties: parsedRow,
        geometry
      };
    }
  });
}

export function castRowGeoJSON(
  parsedRow: JsonObject,
  options: z.infer<typeof EnforcedWKTOptions>
): Feature | null {
  const { geometryHeader } = options;
  // Numbers.app doesn't prune columns without headers.
  delete parsedRow[''];

  return parseOrError(String(parsedRow[geometryHeader]))
    .chain((value) => rough(value))
    .caseOf({
      Left() {
        return null;
      },
      Right(geojsonResult): Feature {
        const geometry = geojsonResult.geojson.features[0]?.geometry;
        delete parsedRow[geometryHeader];
        return {
          type: 'Feature',
          properties: parsedRow,
          geometry
        };
      }
    });
}

export function castRowLonLat(
  parsedRow: JsonObject,
  options: z.infer<typeof EnforcedLonLatOptions>
): Feature | null {
  const { latitudeHeader, longitudeHeader } = options;
  const lon = safeParse(parsedRow[longitudeHeader]);
  const lat = safeParse(parsedRow[latitudeHeader]);
  // Numbers.app doesn't prune columns without headers.
  delete parsedRow[''];

  if (Number.isNaN(lon) || Number.isNaN(lat)) {
    // TODO: handle errors
    // errors.push({
    //   message: "A row contained an invalid value for latitude or longitude",
    //   row: parsed[i],
    //   index: i,
    // });
  } else {
    delete parsedRow[longitudeHeader];
    delete parsedRow[latitudeHeader];

    return {
      type: 'Feature',
      properties: parsedRow,
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    };
  }
  return null;
}
