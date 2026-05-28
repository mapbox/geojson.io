import { CIRCLE_TYPE } from 'state/mode';
import { pointFeature } from 'test/helpers';
import { describe, expect, it } from 'vitest';
import { getCircleProp, getCircleRadius, makeCircleNative } from './circle';
import { e6geojson } from './geometry';

describe('makeCircleNative', () => {
  it('degrees', () => {
    expect(
      e6geojson(
        makeCircleNative({
          center: [0, 0],
          value: 10,
          type: CIRCLE_TYPE.DEGREES
        })
      )
    ).toMatchSnapshot();
  });
  it('geodesic', () => {
    expect(
      e6geojson(
        makeCircleNative({
          center: [0, 0],
          value: 10,
          type: CIRCLE_TYPE.GEODESIC
        })
      )
    ).toMatchSnapshot();
  });
  it('mercator', () => {
    const circle = makeCircleNative({
      center: [0, 0],
      value: 10,
      type: CIRCLE_TYPE.MERCATOR
    });
    expect(e6geojson(circle)).toMatchSnapshot();
  });
});

describe('getCircleRadius', () => {
  it('null', () => {
    expect(getCircleRadius(pointFeature)).toBeNull();
  });
});

describe('getCircleProp', () => {
  it('null', () => {
    expect(getCircleProp(pointFeature)).toBeNull();
  });
});
