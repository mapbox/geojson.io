import { NIL } from 'uuid';
import { describe, expect, test } from 'vitest';
import { UIDMap } from './id_mapper';

const ids = Array.from({ length: 5 }, (_, i) => {
  return `${i}${NIL.substring(2)}`;
});

describe('IDMap', () => {
  test('empty', () => {
    expect(UIDMap.empty()).toEqual({
      uuids: [],
      intids: new Map()
    });
  });

  test('pushUUID', () => {
    const map = UIDMap.empty();
    UIDMap.pushUUID(map, NIL);
    expect(map).toMatchInlineSnapshot(`
      {
        "intids": Map {
          "00000000-0000-0000-0000-000000000000" => 0,
        },
        "uuids": [
          "00000000-0000-0000-0000-000000000000",
        ],
      }
    `);
    expect(UIDMap.getIntID(map, NIL)).toEqual(0);
    UIDMap.pushUUID(map, NIL);
    expect(UIDMap.getIntID(map, NIL)).toEqual(0);
    UIDMap.pushUUID(map, ids[0]);
    expect(UIDMap.getIntID(map, NIL)).toEqual(0);
    expect(UIDMap.getIntID(map, ids[0])).toEqual(1);
    for (const id of ids) {
      UIDMap.pushUUID(map, id);
    }
    expect(UIDMap.getIntID(map, ids[1])).toEqual(2);
    expect(UIDMap.getIntID(map, ids[2])).toEqual(3);
    expect(UIDMap.getIntID(map, ids[3])).toEqual(4);
    expect(UIDMap.getIntID(map, ids[4])).toEqual(5);
    expect(UIDMap.getUUID(map, 0)).toEqual(NIL);
    expect(UIDMap.getUUID(map, 1)).toEqual(ids[0]);
  });

  test('deleteUUID', () => {
    const map = UIDMap.empty();
    UIDMap.pushUUID(map, NIL);
    expect(UIDMap.getIntID(map, NIL)).toEqual(0);
    UIDMap.deleteUUID(map, NIL);
    expect(UIDMap.getIntID(map, NIL)).toEqual(undefined);
  });
});
