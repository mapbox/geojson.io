export default class DataSlice {
  _dataView: DataView;
  _sliceOffset: number;
  _bigTiff: boolean;
  _littleEndian: boolean;
  constructor(
    arrayBuffer: ArrayBuffer,
    sliceOffset: number,
    littleEndian: boolean,
    bigTiff: boolean
  ) {
    this._dataView = new DataView(arrayBuffer);
    this._sliceOffset = sliceOffset;
    this._littleEndian = littleEndian;
    this._bigTiff = bigTiff;
  }

  get sliceOffset() {
    return this._sliceOffset;
  }

  get sliceTop() {
    return this._sliceOffset + this.buffer.byteLength;
  }

  get littleEndian() {
    return this._littleEndian;
  }

  get bigTiff() {
    return this._bigTiff;
  }

  get buffer() {
    return this._dataView.buffer;
  }

  covers(offset: number, length: number) {
    return this.sliceOffset <= offset && this.sliceTop >= offset + length;
  }

  readUint8(offset: number) {
    return this._dataView.getUint8(offset - this._sliceOffset);
  }

  readInt8(offset: number) {
    return this._dataView.getInt8(offset - this._sliceOffset);
  }

  readUint16(offset: number) {
    return this._dataView.getUint16(
      offset - this._sliceOffset,
      this._littleEndian
    );
  }

  readInt16(offset: number) {
    return this._dataView.getInt16(
      offset - this._sliceOffset,
      this._littleEndian
    );
  }

  readUint32(offset: number) {
    return this._dataView.getUint32(
      offset - this._sliceOffset,
      this._littleEndian
    );
  }

  readInt32(offset: number) {
    return this._dataView.getInt32(
      offset - this._sliceOffset,
      this._littleEndian
    );
  }

  readFloat32(offset: number) {
    return this._dataView.getFloat32(
      offset - this._sliceOffset,
      this._littleEndian
    );
  }

  readFloat64(offset: number) {
    return this._dataView.getFloat64(
      offset - this._sliceOffset,
      this._littleEndian
    );
  }

  readUint64(offset: number) {
    const left = this.readUint32(offset);
    const right = this.readUint32(offset + 4);
    let combined: number;
    if (this._littleEndian) {
      combined = left + 2 ** 32 * right;
      if (!Number.isSafeInteger(combined)) {
        throw new Error(
          `${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
        );
      }
      return combined;
    }
    combined = 2 ** 32 * left + right;
    if (!Number.isSafeInteger(combined)) {
      throw new Error(
        `${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
      );
    }

    return combined;
  }

  // adapted from https://stackoverflow.com/a/55338384/8060591
  readInt64(offset: number) {
    let value = 0;
    const isNegative =
      (this._dataView.getUint8(offset + (this._littleEndian ? 7 : 0)) & 0x80) >
      0;
    let carrying = true;
    for (let i = 0; i < 8; i++) {
      let byte = this._dataView.getUint8(
        offset + (this._littleEndian ? i : 7 - i)
      );
      if (isNegative) {
        if (carrying) {
          if (byte !== 0x00) {
            byte = ~(byte - 1) & 0xff;
            carrying = false;
          }
        } else {
          byte = ~byte & 0xff;
        }
      }
      value += byte * 256 ** i;
    }
    if (isNegative) {
      value = -value;
    }
    return value;
  }

  readOffset(offset: number) {
    if (this._bigTiff) {
      return this.readUint64(offset);
    }
    return this.readUint32(offset);
  }
}
