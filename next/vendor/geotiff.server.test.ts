import { expect, describe, it } from 'vitest';

import Fs from 'fs';
import { TextDecoder } from 'fastestsmallesttextencoderdecoder';
import Path from 'path';
import { getGeotiffExtent } from './geotiff';
global.TextDecoder = TextDecoder;

describe('getGeotiffExtent', () => {
  it('can get an extent', async () => {
    const arrayBuffer = Fs.readFileSync(Path.join(__dirname, '../test/red.tif'))
      .buffer as ArrayBuffer;
    const output = await getGeotiffExtent(arrayBuffer);
    expect(output).toEqual({
      features: [
        {
          geometry: {
            coordinates: [
              [
                [0, -32],
                [0, 0],
                [32, 0],
                [32, -32],
                [0, -32]
              ]
            ],
            type: 'Polygon'
          },
          properties: {
            GTModelTypeGeoKey: 2,
            GTRasterTypeGeoKey: 1,
            GeogAngularUnitsGeoKey: 9102,
            GeogCitationGeoKey: 'WGS 84',
            GeogInvFlatteningGeoKey: 298.257223563,
            GeogSemiMajorAxisGeoKey: 6378137,
            GeographicTypeGeoKey: 4326
          },
          type: 'Feature'
        }
      ],
      type: 'FeatureCollection'
    });
  });
});
