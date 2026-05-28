import { UIDMap } from 'app/lib/id_mapper';
import { USelection } from 'state';
import { SELECTION_NONE } from 'state/jotai';
import { fcLineString, NIL_PREVIEW, wrapMapAndId } from 'test/helpers';
import { describe, expect, it } from 'vitest';
import { splitFeatureGroups } from './split_feature_groups';

describe('splitFeatureGroups', () => {
  it('base case', () => {
    expect(
      splitFeatureGroups({
        data: {
          selection: SELECTION_NONE,
          featureMap: new Map()
        },
        previewProperty: NIL_PREVIEW,
        lastSymbolization: null,
        idMap: UIDMap.empty()
      })
    ).toMatchInlineSnapshot(`
      {
        "ephemeral": [],
        "features": [],
        "selectionIds": Set {},
        "synthetic": [],
      }
    `);
  });

  it('basic case', () => {
    const { featureMap, idMap } = wrapMapAndId(fcLineString);

    expect(
      splitFeatureGroups({
        data: {
          selection: SELECTION_NONE,
          featureMap
        },
        previewProperty: NIL_PREVIEW,
        lastSymbolization: null,
        idMap
      })
    ).toMatchInlineSnapshot(`
      {
        "ephemeral": [],
        "features": [
          {
            "geometry": {
              "coordinates": [
                [
                  0,
                  0,
                ],
                [
                  1,
                  1,
                ],
                [
                  2,
                  2,
                ],
              ],
              "type": "LineString",
            },
            "id": 0,
            "properties": null,
            "type": "Feature",
          },
        ],
        "selectionIds": Set {},
        "synthetic": [],
      }
    `);
  });

  it('feature selected', () => {
    const { featureMap, idMap } = wrapMapAndId(fcLineString);

    expect(
      splitFeatureGroups({
        data: {
          selection: USelection.fromIds(['000000000000000000000']),
          featureMap
        },
        previewProperty: NIL_PREVIEW,
        lastSymbolization: null,
        idMap
      })
    ).toMatchInlineSnapshot(`
      {
        "ephemeral": [
          {
            "geometry": {
              "coordinates": [
                [
                  0,
                  0,
                ],
                [
                  1,
                  1,
                ],
                [
                  2,
                  2,
                ],
              ],
              "type": "LineString",
            },
            "id": 0,
            "properties": null,
            "type": "Feature",
          },
        ],
        "features": [],
        "selectionIds": Set {},
        "synthetic": [
          Vertex {
            "geometry": {
              "coordinates": [
                0,
                0,
              ],
              "type": "Point",
            },
            "id": 1000000000,
            "properties": null,
            "type": "Feature",
          },
          Midpoint {
            "geometry": {
              "coordinates": [
                0.5,
                0.5000190396762463,
              ],
              "type": "Point",
            },
            "id": 1000000001,
            "properties": null,
            "type": "Feature",
          },
          Vertex {
            "geometry": {
              "coordinates": [
                1,
                1,
              ],
              "type": "Point",
            },
            "id": 1000000002,
            "properties": null,
            "type": "Feature",
          },
          Midpoint {
            "geometry": {
              "coordinates": [
                1.5,
                1.500057130632186,
              ],
              "type": "Point",
            },
            "id": 1000000003,
            "properties": null,
            "type": "Feature",
          },
          Vertex {
            "geometry": {
              "coordinates": [
                2,
                2,
              ],
              "type": "Point",
            },
            "id": 1000000004,
            "properties": null,
            "type": "Feature",
          },
        ],
      }
    `);
  });
});
