import { expect, describe, it } from 'vitest';

import Fs from 'fs';
import Path from 'path';
import { getImageData, toGeoJSON } from './exif';

const iphoneExif = {
  '31': 19.988142131979696,
  '316': 'iPhone 12 mini',
  '322': 512,
  '323': 512,
  '36880': '-08:00',
  '36881': '-08:00',
  '36882': '-08:00',
  '42034': [1.5499999523160568, 4.2, 1.6, 2.4],
  '42035': 'Apple',
  '42036': 'iPhone 12 mini back dual wide camera 4.2mm f/1.6',
  '42080': 2,
  ApertureValue: 1.3561438092556088,
  BrightnessValue: 9.921638595489581,
  ColorSpace: 65535,
  ComponentsConfiguration: [1, 2, 3, 0],
  DateTime: '2020:11:26 12:11:07',
  DateTimeDigitized: '2020:11:26 12:11:07',
  DateTimeOriginal: '2020:11:26 12:11:07',
  ExifIFDPointer: 262,
  ExifVersion: [48, 50, 51, 49],
  ExposureBias: 0,
  ExposureMode: 0,
  ExposureProgram: 'Normal program',
  ExposureTime: 0.0002680246582685607,
  FNumber: 1.6,
  Flash: 'Flash did not fire, compulsory flash mode',
  FlashpixVersion: [48, 49, 48, 48],
  FocalLength: 4.2,
  FocalLengthIn35mmFilm: 26,
  GPSAltitude: 4.4,
  GPSAltitudeRef: 0,
  GPSImgDirection: 299.76342788171394,
  GPSImgDirectionRef: 'T',
  GPSInfoIFDPointer: 2258,
  GPSLatitude: [36, 48, 9.99],
  GPSLatitudeRef: 'N',
  GPSLongitude: [121, 47, 2],
  GPSLongitudeRef: 'W',
  GPSSpeed: 0,
  GPSSpeedRef: 'K',
  ISOSpeedRatings: 32,
  Make: 'Apple',
  MeteringMode: 'Pattern',
  Model: 'iPhone 12 mini',
  Orientation: 1,
  PixelXDimension: 4032,
  PixelYDimension: 3024,
  ResolutionUnit: 2,
  SceneCaptureType: 'Standard',
  SceneType: 'Directly photographed',
  SensingMethod: 'One-chip color area sensor',
  ShutterSpeedValue: 11.865479390681003,
  Software: '14.2',
  SubjectArea: [2009, 1503, 2208, 1327],
  SubsecTime: '292',
  SubsecTimeDigitized: '292',
  SubsecTimeOriginal: '292',
  WhiteBalance: 'Auto white balance',
  XResolution: 72,
  YCbCrPositioning: 1,
  YResolution: 72
};

describe('EXIF', () => {
  it('toGeoJSON (bad data)', async () => {
    await expect(
      toGeoJSON(Buffer.from([0xff, 0xd8]).buffer as ArrayBuffer)
    ).resolves.toBeLeft();
  });
  it('toGeoJSON', async () => {
    const input = Fs.readFileSync(Path.join('test', 'exifimage.jpg'))
      .buffer as ArrayBuffer;
    const gj = (await toGeoJSON(input)).unsafeCoerce();
    expect(gj).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: iphoneExif,
          geometry: {
            type: 'Point',
            coordinates: [-121.78388888888888, 36.802775]
          }
        }
      ]
    });
  });
  it('getImageData', function () {
    const input = Fs.readFileSync(Path.join('test', 'exifimage.jpg'));
    expect(getImageData(input.buffer)).toEqualRight(iphoneExif);
    const input2 = Fs.readFileSync(Path.join('test', 'exifimage2.jpg'));
    expect(getImageData(input2.buffer)).toEqualRight({
      ColorSpace: 65535,
      ExifIFDPointer: 114,
      Orientation: 1,
      PixelXDimension: 88,
      PixelYDimension: 100,
      ResolutionUnit: 2,
      Software: 'GIMP 2.4.5',
      UserComment: [
        65, 83, 67, 73, 73, 0, 0, 0, 97, 53, 99, 98, 48, 49, 53, 53, 48, 100,
        98, 98, 57, 97, 54, 98, 102, 55, 51, 50, 102, 56, 55, 101, 52, 49, 51,
        102, 54, 101, 50, 51, 49, 99, 99, 52, 53, 56, 49, 101, 54, 97, 53, 98,
        101, 56, 48, 48, 102, 98, 48, 56, 55, 49, 100, 99, 101, 48, 55, 54, 48,
        99, 100, 53, 0, 0
      ],
      XResolution: 300,
      YResolution: 300
    });
  });
  it('getImageData (invalid data)', function () {
    expect(getImageData(Buffer.from('').buffer)).toBeLeft();
    expect(getImageData(Buffer.from('hihi').buffer)).toBeLeft();
    expect(getImageData(Buffer.from([0xff, 0xd8]).buffer)).toBeLeft();
  });
});
