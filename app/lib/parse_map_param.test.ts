import { describe, expect, it } from 'vitest';
import { parseMapParam, serializeMapParam } from './parse_map_param';

describe('parseMapParam', () => {
  it('parses a valid map param with all 5 values', () => {
    expect(parseMapParam('9.53/40.7084/-73.9706/-20/28')).toEqual({
      zoom: 9.53,
      lat: 40.7084,
      lng: -73.9706,
      bearing: -20,
      pitch: 28
    });
  });

  it('parses with 3 values (bearing and pitch default to 0)', () => {
    expect(parseMapParam('5/51.5/-0.09')).toEqual({
      zoom: 5,
      lat: 51.5,
      lng: -0.09,
      bearing: 0,
      pitch: 0
    });
  });

  it('parses with 4 values (pitch defaults to 0)', () => {
    expect(parseMapParam('10/48.8566/2.3522/45')).toEqual({
      zoom: 10,
      lat: 48.8566,
      lng: 2.3522,
      bearing: 45,
      pitch: 0
    });
  });

  it('returns null for fewer than 3 parts', () => {
    expect(parseMapParam('9.53/40')).toBeNull();
    expect(parseMapParam('9.53')).toBeNull();
    expect(parseMapParam('')).toBeNull();
  });

  it('returns null for NaN values', () => {
    expect(parseMapParam('abc/40/10')).toBeNull();
    expect(parseMapParam('9/abc/10')).toBeNull();
    expect(parseMapParam('9/40/abc')).toBeNull();
    expect(parseMapParam('9/40/10/abc/0')).toBeNull();
    expect(parseMapParam('9/40/10/0/abc')).toBeNull();
  });

  it('returns null for out-of-range lat', () => {
    expect(parseMapParam('9/91/10')).toBeNull();
    expect(parseMapParam('9/-91/10')).toBeNull();
  });

  it('returns null for out-of-range lng', () => {
    expect(parseMapParam('9/40/181')).toBeNull();
    expect(parseMapParam('9/40/-181')).toBeNull();
  });

  it('returns null for out-of-range zoom', () => {
    expect(parseMapParam('-1/40/10')).toBeNull();
    expect(parseMapParam('27/40/10')).toBeNull();
  });

  it('returns null for out-of-range pitch', () => {
    expect(parseMapParam('9/40/10/0/86')).toBeNull();
    expect(parseMapParam('9/40/10/0/-1')).toBeNull();
  });

  it('accepts boundary values for lat, lng, zoom, and pitch', () => {
    expect(parseMapParam('0/90/180/0/0')).toEqual({
      zoom: 0,
      lat: 90,
      lng: 180,
      bearing: 0,
      pitch: 0
    });
    expect(parseMapParam('26/-90/-180/0/85')).toEqual({
      zoom: 26,
      lat: -90,
      lng: -180,
      bearing: 0,
      pitch: 85
    });
  });

  it('accepts negative bearing values', () => {
    expect(parseMapParam('9/40/10/-180/0')).toEqual({
      zoom: 9,
      lat: 40,
      lng: 10,
      bearing: -180,
      pitch: 0
    });
  });
});

describe('serializeMapParam', () => {
  it('omits bearing and pitch when both are 0', () => {
    expect(
      serializeMapParam({
        zoom: 9.53,
        lat: 40.71,
        lng: -73.97,
        bearing: 0,
        pitch: 0
      })
    ).toBe('9.53/40.71/-73.97');
  });

  it('includes bearing but omits pitch when bearing is non-zero and pitch is 0', () => {
    expect(
      serializeMapParam({
        zoom: 9.53,
        lat: 40.71,
        lng: -73.97,
        bearing: -20,
        pitch: 0
      })
    ).toBe('9.53/40.71/-73.97/-20');
  });

  it('includes both bearing and pitch when pitch is non-zero (even if bearing is 0)', () => {
    expect(
      serializeMapParam({
        zoom: 9.53,
        lat: 40.71,
        lng: -73.97,
        bearing: 0,
        pitch: 28
      })
    ).toBe('9.53/40.71/-73.97/0/28');
  });

  it('includes both bearing and pitch when both are non-zero', () => {
    expect(
      serializeMapParam({
        zoom: 9.53,
        lat: 40.71,
        lng: -73.97,
        bearing: -20,
        pitch: 28
      })
    ).toBe('9.53/40.71/-73.97/-20/28');
  });

  it('rounds zoom to 2 decimal places', () => {
    expect(
      serializeMapParam({
        zoom: 9.123456,
        lat: 40,
        lng: -73,
        bearing: 0,
        pitch: 0
      })
    ).toBe('9.12/40/-73');
  });

  it('rounds lat/lng to 2 decimal places', () => {
    expect(
      serializeMapParam({
        zoom: 10,
        lat: 40.12789,
        lng: -73.98654,
        bearing: 0,
        pitch: 0
      })
    ).toBe('10/40.13/-73.99');
  });

  it('rounds bearing to 1 decimal place', () => {
    expect(
      serializeMapParam({
        zoom: 10,
        lat: 40,
        lng: -73,
        bearing: 20.456,
        pitch: 0
      })
    ).toBe('10/40/-73/20.5');
  });

  it('rounds pitch to whole numbers', () => {
    expect(
      serializeMapParam({
        zoom: 10,
        lat: 40,
        lng: -73,
        bearing: 0,
        pitch: 28.7
      })
    ).toBe('10/40/-73/0/29');
  });

  it('round-trips through parse and serialize (with bearing and pitch)', () => {
    const original = '9.53/40.71/-73.97/-20/28';
    const parsed = parseMapParam(original);
    expect(parsed).not.toBeNull();
    expect(serializeMapParam(parsed!)).toBe(original);
  });

  it('round-trips through parse and serialize (no bearing/pitch)', () => {
    const original = '5/51.5/-0.09';
    const parsed = parseMapParam(original);
    expect(parsed).not.toBeNull();
    expect(serializeMapParam(parsed!)).toBe(original);
  });

  it('round-trips through parse and serialize (bearing only)', () => {
    const original = '10/48.87/2.35/45';
    const parsed = parseMapParam(original);
    expect(parsed).not.toBeNull();
    expect(serializeMapParam(parsed!)).toBe(original);
  });
});
