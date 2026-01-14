/**
 * Exif.js (https://github.com/andrew-womeldorf/exif-js)
 * Copyright 2008 Jacob Seidelin
 * MIT License (https://raw.githubusercontent.com/andrew-womeldorf/exif-js/master/LICENSE)
 */
import { Tags, StringValues } from './exif_constants';
import type { FeatureCollection } from 'types';
// import { IMAGE_SYM } from "lib/constants";
import { ConvertError, GeojsonIOError } from 'app/lib/errors';
import type { Either } from 'purify-ts/Either';
import { Left, Right } from 'purify-ts/Either';
import { EitherAsync } from 'purify-ts/EitherAsync';

/* eslint @typescript-eslint/no-explicit-any: 0 */

type ExifValue = string | number | number[] | File;
type TagObject = {
  [key: string]: ExifValue;
};

/**
 * Determine the starting point in the file for reading EXIF data.
 */
export function getImageData(
  file: ArrayBufferLike
): Either<GeojsonIOError, TagObject> {
  const dataView = new DataView(file);

  if (
    dataView.byteLength < 2 ||
    dataView.getUint8(0) !== 0xff ||
    dataView.getUint8(1) !== 0xd8
  ) {
    return Left(new GeojsonIOError('Not a valid JPEG'));
  }

  let offset = 2;
  const length = dataView.byteLength;
  let marker;

  while (offset < length) {
    if (dataView.getUint8(offset) !== 0xff) {
      return Left(
        new GeojsonIOError(
          `Not a valid marker at offset ${offset}, found: ${dataView.getUint8(
            offset
          )}`
        )
      );
    }

    marker = dataView.getUint8(offset + 1);

    // we could implement handling for other markers here,
    // but we're only looking for 0xFFE1 for EXIF data
    if (marker === 225) {
      return Right(readEXIFData(dataView, offset + 4));
    } else {
      offset += 2 + dataView.getUint16(offset + 2);
    }
  }
  return Left(new GeojsonIOError('Could not find EXIF data'));
}

export function toGeoJSON(arrayBuffer: ArrayBuffer) {
  return EitherAsync<GeojsonIOError, FeatureCollection>(
    async ({ liftEither, throwE }) => {
      const exif = await liftEither(getImageData(arrayBuffer));

      if (exif.GPSLongitude && exif.GPSLatitude) {
        const lat = exif.GPSLatitude as number[];
        const lon = exif.GPSLongitude as number[];
        const lonr = exif.GPSLongitudeRef === 'W' ? -1 : 1;
        const latr = exif.GPSLatitudeRef === 'S' ? -1 : 1;
        return {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: exif,
              geometry: {
                type: 'Point',
                coordinates: [
                  (lon[0] + lon[1] / 60 + lon[2] / 3600) * lonr,
                  (lat[0] + lat[1] / 60 + lat[2] / 3600) * latr
                ]
              }
            }
          ]
        };
      }

      return throwE(new ConvertError('No location data found in JPEG'));
    }
  );
}

/**
 * Read the metadata tags from the file between starting/ending points.
 */
function readTags(
  tags: TagObject,
  dataView: DataView,
  tiffStart: number,
  dirStart: number,
  bigEnd: boolean
) {
  const entries = dataView.getUint16(dirStart, !bigEnd);

  for (let i = 0; i < entries; i++) {
    const entryOffset = dirStart + i * 12 + 2;
    const tag: string | number = dataView.getUint16(entryOffset, !bigEnd);
    // Skip MakerNote: this is an opaque field, often binary.
    if (tag === 0x927c) continue;
    const key = tag in Tags ? Tags[tag] : tag;
    const rawValue = readTagValue(dataView, entryOffset, tiffStart, bigEnd);
    if (rawValue === null) continue;
    const value =
      typeof rawValue === 'number' &&
      StringValues[key] &&
      StringValues[key][rawValue]
        ? StringValues[key][rawValue]
        : rawValue;
    tags[key] = value;
  }
  return tags;
}

/**
 * Get the value for a tag
 */
/* eslint-disable complexity */
function readTagValue(
  dataView: DataView,
  entryOffset: number,
  tiffStart: number,
  bigEnd: boolean
): ExifValue | null {
  const type = dataView.getUint16(entryOffset + 2, !bigEnd);
  const numValues = dataView.getUint32(entryOffset + 4, !bigEnd);
  const valueOffset = dataView.getUint32(entryOffset + 8, !bigEnd) + tiffStart;

  switch (type) {
    case 1: // byte, 8-bit unsigned int
    case 7: // undefined, 8-bit byte, value depending on field
      if (numValues === 1) {
        return dataView.getUint8(entryOffset + 8);
      } else {
        const offset = numValues > 4 ? valueOffset : entryOffset + 8;
        const vals = [];
        for (let n = 0; n < numValues; n++) {
          vals[n] = dataView.getUint8(offset + n);
        }
        return vals;
      }

    case 2: {
      // ascii, 8-bit byte
      const offset = numValues > 4 ? valueOffset : entryOffset + 8;
      return getStringFromDB(dataView, offset, numValues - 1);
    }

    case 3: {
      // short, 16 bit int
      if (numValues === 1) {
        return dataView.getUint16(entryOffset + 8, !bigEnd);
      } else {
        const offset = numValues > 2 ? valueOffset : entryOffset + 8;
        const vals = [];
        for (let n = 0; n < numValues; n++) {
          vals[n] = dataView.getUint16(offset + 2 * n, !bigEnd);
        }
        return vals;
      }
    }

    case 4: {
      // long, 32 bit int
      if (numValues === 1) {
        return dataView.getUint32(entryOffset + 8, !bigEnd);
      } else {
        const vals = [];
        for (let n = 0; n < numValues; n++) {
          vals[n] = dataView.getUint32(valueOffset + 4 * n, !bigEnd);
        }
        return vals;
      }
    }

    case 5: {
      // rational = two long values, first is numerator, second is denominator
      if (numValues === 1) {
        const numerator = dataView.getUint32(valueOffset, !bigEnd);
        const denominator = dataView.getUint32(valueOffset + 4, !bigEnd);
        return numerator / denominator;
      } else {
        const vals = [];
        for (let n = 0; n < numValues; n++) {
          const numerator = dataView.getUint32(valueOffset + 8 * n, !bigEnd);
          const denominator = dataView.getUint32(
            valueOffset + 4 + 8 * n,
            !bigEnd
          );
          vals[n] = numerator / denominator;
        }
        return vals;
      }
    }

    case 9: {
      // slong, 32 bit signed int
      if (numValues === 1) {
        return dataView.getInt32(entryOffset + 8, !bigEnd);
      } else {
        const vals = [];
        for (let n = 0; n < numValues; n++) {
          vals[n] = dataView.getInt32(valueOffset + 4 * n, !bigEnd);
        }
        return vals;
      }
    }

    case 10: {
      // signed rational, two slongs, first is numerator, second is denominator
      if (numValues === 1) {
        return (
          dataView.getInt32(valueOffset, !bigEnd) /
          dataView.getInt32(valueOffset + 4, !bigEnd)
        );
      } else {
        const vals = [];
        for (let n = 0; n < numValues; n++) {
          vals[n] =
            dataView.getInt32(valueOffset + 8 * n, !bigEnd) /
            dataView.getInt32(valueOffset + 4 + 8 * n, !bigEnd);
        }
        return vals;
      }
    }
    default: {
      // console.error("Encountered an unknown type of value");
      return null;
    }
  }
}
/* eslint-enable complexity */

function getStringFromDB(buffer: DataView, start: number, length: number) {
  let outstr = '';
  for (let n = start; n < start + length; n++) {
    outstr += String.fromCharCode(buffer.getUint8(n));
  }
  return outstr;
}

/**
 * Parses TIFF, EXIF and GPS tags, and looks for a thumbnail
 */
function readEXIFData(dataView: DataView, start: number) {
  if (getStringFromDB(dataView, start, 4) !== 'Exif') {
    throw new Error(
      'Not valid EXIF data! ' + getStringFromDB(dataView, start, 4)
    );
  }

  let bigEnd;
  const tiffOffset = start + 6;

  // test for TIFF validity and endianness
  if (dataView.getUint16(tiffOffset) === 0x4949) {
    bigEnd = false;
  } else if (dataView.getUint16(tiffOffset) === 0x4d4d) {
    bigEnd = true;
  } else {
    throw new Error('Not valid TIFF data! (no 0x4949 or 0x4D4D)');
  }

  if (dataView.getUint16(tiffOffset + 2, !bigEnd) !== 0x002a) {
    throw new Error('Not valid TIFF data! (no 0x002A)');
  }

  const firstIFDOffset = dataView.getUint32(tiffOffset + 4, !bigEnd);

  if (firstIFDOffset < 0x00000008) {
    throw new Error('Not valid TIFF data! (First offset less than 8)');
  }

  const tags: TagObject = {};

  readTags(tags, dataView, tiffOffset, tiffOffset + firstIFDOffset, bigEnd);

  if (tags.ExifIFDPointer) {
    readTags(
      tags,
      dataView,
      tiffOffset,
      tiffOffset + (tags.ExifIFDPointer as number),
      bigEnd
    );
  }

  if (tags.GPSInfoIFDPointer) {
    readTags(
      tags,
      dataView,
      tiffOffset,
      tiffOffset + (tags.GPSInfoIFDPointer as number),
      bigEnd
    );
  }

  return tags;
}
