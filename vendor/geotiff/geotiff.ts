import GeoTIFFImage from './geotiffimage';
import DataView64 from './dataview64';
import DataSlice from './dataslice';
import type { Source } from './source';
import { fieldTypes, fieldTagNames, arrayFields, geoKeyNames } from './globals';

type FileDirectory = {
  GeoKeyDirectory?: {
    [key: string]: number;
  };
} & {
  [key: string]: string | number | Uint8Array;
};

function getFieldTypeLength(fieldType: number) {
  switch (fieldType) {
    case fieldTypes.BYTE:
    case fieldTypes.ASCII:
    case fieldTypes.SBYTE:
    case fieldTypes.UNDEFINED:
      return 1;
    case fieldTypes.SHORT:
    case fieldTypes.SSHORT:
      return 2;
    case fieldTypes.LONG:
    case fieldTypes.SLONG:
    case fieldTypes.FLOAT:
    case fieldTypes.IFD:
      return 4;
    case fieldTypes.RATIONAL:
    case fieldTypes.SRATIONAL:
    case fieldTypes.DOUBLE:
    case fieldTypes.LONG8:
    case fieldTypes.SLONG8:
    case fieldTypes.IFD8:
      return 8;
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }
}

function parseGeoKeyDirectory(fileDirectory: FileDirectory) {
  const rawGeoKeyDirectory = fileDirectory.GeoKeyDirectory;
  if (!rawGeoKeyDirectory) {
    return null;
  }

  const geoKeyDirectory: {
    [key: string]: number | string | Uint8Array;
  } = {};
  for (let i = 4; i <= rawGeoKeyDirectory[3] * 4; i += 4) {
    const key = geoKeyNames[rawGeoKeyDirectory[i]];
    const location = rawGeoKeyDirectory[i + 1]
      ? fieldTagNames[rawGeoKeyDirectory[i + 1]]
      : null;
    const count = rawGeoKeyDirectory[i + 2];
    const offset = rawGeoKeyDirectory[i + 3];

    let value: number | string | Uint8Array | null = null;
    if (!location) {
      value = offset;
    } else {
      value = fileDirectory[location];
      if (typeof value === 'undefined' || value === null) {
        throw new Error(`Could not get value of geoKey '${key}'.`);
      } else if (typeof value === 'string') {
        value = value.substring(offset, offset + count - 1);
      } else if (typeof value === 'object' && 'subarray' in value) {
        value = value.subarray(offset, offset + count);
        if (count === 1) {
          value = value[0];
        }
      }
    }
    geoKeyDirectory[key] = value;
  }
  return geoKeyDirectory;
}

function getValues(
  dataSlice: DataSlice,
  fieldType: number,
  count: number,
  offset: number
) {
  let values = null;
  let readMethod = null;
  const fieldTypeLength = getFieldTypeLength(fieldType);

  switch (fieldType) {
    case fieldTypes.BYTE:
    case fieldTypes.ASCII:
    case fieldTypes.UNDEFINED:
      values = new Uint8Array(count);
      readMethod = dataSlice.readUint8;
      break;
    case fieldTypes.SBYTE:
      values = new Int8Array(count);
      readMethod = dataSlice.readInt8;
      break;
    case fieldTypes.SHORT:
      values = new Uint16Array(count);
      readMethod = dataSlice.readUint16;
      break;
    case fieldTypes.SSHORT:
      values = new Int16Array(count);
      readMethod = dataSlice.readInt16;
      break;
    case fieldTypes.LONG:
    case fieldTypes.IFD:
      values = new Uint32Array(count);
      readMethod = dataSlice.readUint32;
      break;
    case fieldTypes.SLONG:
      values = new Int32Array(count);
      readMethod = dataSlice.readInt32;
      break;
    case fieldTypes.LONG8:
    case fieldTypes.IFD8:
      values = new Array(count);
      readMethod = dataSlice.readUint64;
      break;
    case fieldTypes.SLONG8:
      values = new Array(count);
      readMethod = dataSlice.readInt64;
      break;
    case fieldTypes.RATIONAL:
      values = new Uint32Array(count * 2);
      readMethod = dataSlice.readUint32;
      break;
    case fieldTypes.SRATIONAL:
      values = new Int32Array(count * 2);
      readMethod = dataSlice.readInt32;
      break;
    case fieldTypes.FLOAT:
      values = new Float32Array(count);
      readMethod = dataSlice.readFloat32;
      break;
    case fieldTypes.DOUBLE:
      values = new Float64Array(count);
      readMethod = dataSlice.readFloat64;
      break;
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }

  // normal fields
  if (
    !(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)
  ) {
    for (let i = 0; i < count; ++i) {
      values[i] = readMethod.call(dataSlice, offset + i * fieldTypeLength);
    }
  } else {
    // RATIONAL or SRATIONAL
    for (let i = 0; i < count; i += 2) {
      values[i] = readMethod.call(dataSlice, offset + i * fieldTypeLength);
      values[i + 1] = readMethod.call(
        dataSlice,
        offset + (i * fieldTypeLength + 4)
      );
    }
  }

  if (fieldType === fieldTypes.ASCII) {
    return new TextDecoder('utf-8').decode(values as BufferSource);
  }
  return values;
}

/**
 * Data class to store the parsed file directory, geo key directory and
 * offset to the next IFD
 */
class ImageFileDirectory {
  fileDirectory: FileDirectory;
  geoKeyDirectory: FileDirectory;
  nextIFDByteOffset: number;
  constructor(
    fileDirectory: FileDirectory,
    geoKeyDirectory: FileDirectory,
    nextIFDByteOffset: number
  ) {
    this.fileDirectory = fileDirectory;
    this.geoKeyDirectory = geoKeyDirectory;
    this.nextIFDByteOffset = nextIFDByteOffset;
  }
}

/**
 * Error class for cases when an IFD index was requested, that does not exist
 * in the file.
 */
class GeoTIFFImageIndexError extends Error {
  index: number;
  constructor(index: number) {
    super(`No image at index ${index}`);
    this.index = index;
  }
}

/**
 * The abstraction for a whole GeoTIFF file.
 * @augments GeoTIFFBase
 */
class GeoTIFF {
  source: Source;
  littleEndian: boolean;
  bigTiff: boolean;
  firstIFDOffset: number;
  ifdRequests: Promise<ImageFileDirectory>[];
  cache: boolean;

  /**
   * @constructor
   * @param source The datasource to read from.
   * @param littleEndian Whether the image uses little endian.
   * @param bigTiff Whether the image uses bigTIFF conventions.
   * @param firstIFDOffset The numeric byte-offset from the start of the image
   *                                to the first IFD.
   * @param [options] further options.
   * @param [options.cache=false] whether or not decoded tiles shall be cached.
   */
  constructor(
    source: Source,
    littleEndian: boolean,
    bigTiff: boolean,
    firstIFDOffset: number,
    options = { cache: false }
  ) {
    this.source = source;
    this.littleEndian = littleEndian;
    this.bigTiff = bigTiff;
    this.firstIFDOffset = firstIFDOffset;
    this.cache = options.cache || false;
    this.ifdRequests = [];
  }

  async getSlice(offset: number, size: number | undefined = undefined) {
    const fallbackSize = this.bigTiff ? 4048 : 1024;
    return new DataSlice(
      await this.source.fetch(
        offset,
        typeof size !== 'undefined' ? size : fallbackSize
      ),
      offset,
      this.littleEndian,
      this.bigTiff
    );
  }

  /**
   * Instructs to parse an image file directory at the given file offset.
   * As there is no way to ensure that a location is indeed the start of an IFD,
   * this function must be called with caution (e.g only using the IFD offsets from
   * the headers or other IFDs).
   * @param offset the offset to parse the IFD at
   * @returns the parsed IFD
   */
  async parseFileDirectoryAt(offset: number): Promise<ImageFileDirectory> {
    const entrySize = this.bigTiff ? 20 : 12;
    const offsetSize = this.bigTiff ? 8 : 2;

    let dataSlice = await this.getSlice(offset);
    const numDirEntries = this.bigTiff
      ? dataSlice.readUint64(offset)
      : dataSlice.readUint16(offset);

    // if the slice does not cover the whole IFD, request a bigger slice, where the
    // whole IFD fits: num of entries + n x tag length + offset to next IFD
    const byteSize = numDirEntries * entrySize + (this.bigTiff ? 16 : 6);
    if (!dataSlice.covers(offset, byteSize)) {
      dataSlice = await this.getSlice(offset, byteSize);
    }

    const fileDirectory: {
      [key: string]: any;
    } = {};

    // loop over the IFD and create a file directory object
    let i = offset + (this.bigTiff ? 8 : 2);
    for (
      let entryCount = 0;
      entryCount < numDirEntries;
      i += entrySize, ++entryCount
    ) {
      const fieldTag = dataSlice.readUint16(i);
      const fieldType = dataSlice.readUint16(i + 2);
      const typeCount = this.bigTiff
        ? dataSlice.readUint64(i + 4)
        : dataSlice.readUint32(i + 4);

      let fieldValues;
      let value;
      const fieldTypeLength = getFieldTypeLength(fieldType);
      const valueOffset = i + (this.bigTiff ? 12 : 8);

      // check whether the value is directly encoded in the tag or refers to a
      // different external byte range
      if (fieldTypeLength * typeCount <= (this.bigTiff ? 8 : 4)) {
        fieldValues = getValues(dataSlice, fieldType, typeCount, valueOffset);
      } else {
        // resolve the reference to the actual byte range
        const actualOffset = dataSlice.readOffset(valueOffset);
        const length = getFieldTypeLength(fieldType) * typeCount;

        // check, whether we actually cover the referenced byte range; if not,
        // request a new slice of bytes to read from it
        if (dataSlice.covers(actualOffset, length)) {
          fieldValues = getValues(
            dataSlice,
            fieldType,
            typeCount,
            actualOffset
          );
        } else {
          const fieldDataSlice = await this.getSlice(actualOffset, length);
          fieldValues = getValues(
            fieldDataSlice,
            fieldType,
            typeCount,
            actualOffset
          );
        }
      }

      // unpack single values from the array
      if (
        typeCount === 1 &&
        arrayFields.indexOf(fieldTag) === -1 &&
        !(
          fieldType === fieldTypes.RATIONAL ||
          fieldType === fieldTypes.SRATIONAL
        )
      ) {
        value = fieldValues[0];
      } else {
        value = fieldValues;
      }

      // write the tags value to the file directly
      fileDirectory[fieldTagNames[fieldTag]] = value;
    }
    const geoKeyDirectory = parseGeoKeyDirectory(fileDirectory);
    const nextIFDByteOffset = dataSlice.readOffset(
      offset + offsetSize + entrySize * numDirEntries
    );

    return new ImageFileDirectory(
      fileDirectory,
      geoKeyDirectory as FileDirectory,
      nextIFDByteOffset
    );
  }

  requestIFD(index: number) {
    // see if we already have that IFD index requested.
    if (this.ifdRequests[index] !== undefined) {
      // attach to an already requested IFD
      return this.ifdRequests[index];
    } else if (index === 0) {
      // special case for index 0
      this.ifdRequests[index] = this.parseFileDirectoryAt(this.firstIFDOffset);
      return this.ifdRequests[index];
    } else if (this.ifdRequests[index - 1] === undefined) {
      // if the previous IFD was not yet loaded, load that one first
      // this is the recursive call.
      try {
        this.ifdRequests[index - 1] = this.requestIFD(index - 1);
      } catch (e) {
        // if the previous one already was an index error, rethrow
        // with the current index
        if (e instanceof GeoTIFFImageIndexError) {
          throw new GeoTIFFImageIndexError(index);
        }
        // rethrow anything else
        throw e;
      }
    }
    // if the previous IFD was loaded, we can finally fetch the one we are interested in.
    // we need to wrap this in an IIFE, otherwise this.ifdRequests[index] would be delayed
    this.ifdRequests[index] = (async () => {
      const previousIfd = await this.ifdRequests[index - 1];
      if (previousIfd.nextIFDByteOffset === 0) {
        throw new GeoTIFFImageIndexError(index);
      }
      return this.parseFileDirectoryAt(previousIfd.nextIFDByteOffset);
    })();
    return this.ifdRequests[index];
  }

  /**
   * Get the n-th internal subfile of an image. By default, the first is returned.
   *
   * @param [index=0] the index of the image to return.
   * @returns the image at the given index
   */
  async getImage(index = 0) {
    const ifd = await this.requestIFD(index);
    return new GeoTIFFImage(
      ifd.fileDirectory,
      ifd.geoKeyDirectory,
      this.littleEndian,
      this.cache,
      this.source
    );
  }

  /**
   * Returns the count of the internal subfiles.
   *
   * @returns the number of internal subfile images
   */
  async getImageCount(): Promise<number> {
    let index = 0;
    // loop until we run out of IFDs
    let hasNext = true;
    while (hasNext) {
      try {
        await this.requestIFD(index);
        ++index;
      } catch (e) {
        if (e instanceof GeoTIFFImageIndexError) {
          hasNext = false;
        } else {
          throw e;
        }
      }
    }
    return index;
  }

  /**
   * Parse a (Geo)TIFF file from the given source.
   *
   * @param source The source of data to parse from.
   * @param options Additional options.
   */
  static async fromSource(source: Source) {
    const headerData = await source.fetch(0, 1024);
    const dataView = new DataView64(headerData);

    const BOM = dataView.getUint16(0, false);
    let littleEndian: boolean;
    if (BOM === 0x4949) {
      littleEndian = true;
    } else if (BOM === 0x4d4d) {
      littleEndian = false;
    } else {
      throw new TypeError('Invalid byte order value.');
    }

    const magicNumber = dataView.getUint16(2, littleEndian);
    let bigTiff: boolean;
    if (magicNumber === 42) {
      bigTiff = false;
    } else if (magicNumber === 43) {
      bigTiff = true;
      const offsetByteSize = dataView.getUint16(4, littleEndian);
      if (offsetByteSize !== 8) {
        throw new Error('Unsupported offset byte-size.');
      }
    } else {
      throw new TypeError('Invalid magic number.');
    }

    const firstIFDOffset = bigTiff
      ? dataView.getUint64(8, littleEndian)
      : dataView.getUint32(4, littleEndian);
    return new GeoTIFF(source, littleEndian, bigTiff, firstIFDOffset);
  }

  /**
   * Closes the underlying file buffer
   * N.B. After the GeoTIFF has been completely processed it needs
   * to be closed but only if it has been constructed from a file.
   */
  close() {
    return false;
  }
}

export default GeoTIFF;
