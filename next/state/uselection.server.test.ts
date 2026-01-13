import { CVertexId } from 'app/lib/id';
import { SELECTION_NONE, type Sel } from 'state/jotai';
import { USelection } from 'state/uselection';
import { fcLineString, wrapMapAndId } from 'test/helpers';
import { describe, expect, it } from 'vitest';

const multi: Sel = {
  type: 'multi',
  ids: ['xxx', 'yyy']
};

describe('USelection', () => {
  it('#getVertexIds', () => {
    expect(USelection.getVertexIds(USelection.none())).toEqual([]);
    expect(
      USelection.getVertexIds({
        type: 'single',
        id: 'xxx',
        parts: [
          {
            type: 'vertex',
            featureId: 0,
            vertex: 10
          }
        ]
      })
    ).toEqual([
      {
        type: 'vertex',
        featureId: 0,
        vertex: 10
      }
    ]);
  });
  it('#none', () => {
    expect(USelection.none()).toEqual(SELECTION_NONE);
  });
  it('#reduce', () => {
    expect(USelection.reduce(USelection.none())).toEqual(SELECTION_NONE);
    expect(USelection.reduce(USelection.single('xxx'))).toEqual(SELECTION_NONE);
    expect(
      USelection.reduce({
        type: 'single',
        id: 'xxx',
        parts: [
          {
            type: 'vertex',
            featureId: 0,
            vertex: 0
          }
        ]
      })
    ).toEqual(USelection.single('xxx'));
  });
  it('#single', () => {
    expect(USelection.single('xxx')).toEqual({
      type: 'single',
      id: 'xxx',
      parts: []
    });
  });
  it('#single', () => {
    expect(
      USelection.isVertexSelected(
        {
          type: 'single',
          id: 'xxx',
          parts: [
            {
              type: 'vertex',
              featureId: 0,
              vertex: 10
            }
          ]
        },
        'xxx',
        {
          type: 'vertex',
          featureId: 0,
          vertex: 10
        }
      )
    ).toBeTruthy();
  });
  it('#fromIds', () => {
    expect(USelection.fromIds([])).toEqual(USelection.none());
    expect(USelection.fromIds(['xxx'])).toEqual(USelection.single('xxx'));
    expect(USelection.fromIds(['xxx', 'yyy'])).toEqual(multi);
  });
  it('#asSingle', () => {
    expect(() => USelection.asSingle(USelection.none())).toThrowError();
    expect(USelection.asSingle(multi)).toEqual(USelection.single('xxx'));
  });
  it('#none', () => {
    expect(USelection.none()).toEqual(SELECTION_NONE);
  });
  it('#toIds', () => {
    expect(USelection.toIds(USelection.none())).toEqual([]);
    expect(USelection.toIds(USelection.single('xxx'))).toEqual(['xxx']);
    expect(USelection.toIds(multi)).toEqual(['xxx', 'yyy']);
  });
  it('#isSelected', () => {
    expect(USelection.isSelected(USelection.none(), 'xxx')).toBeFalsy();
    expect(USelection.isSelected(USelection.single('xxx'), 'xxx')).toBeTruthy();
    expect(USelection.isSelected(multi, 'xxx')).toBeTruthy();
  });
  it('#isVertexSelected', () => {
    expect(
      USelection.isVertexSelected(
        USelection.single('xxx'),
        'xxx',
        new CVertexId(0, 0)
      )
    ).toBeFalsy();
  });
  it('#toggleSelectionId', () => {
    expect(USelection.toggleSelectionId(USelection.none(), 'xxx')).toEqual(
      USelection.single('xxx')
    );
    expect(
      USelection.toggleSelectionId(USelection.single('xxx'), 'xxx')
    ).toEqual(USelection.none());
  });
  it('#toggleSingleSelectionId', () => {
    expect(
      USelection.toggleSingleSelectionId(USelection.none(), 'xxx')
    ).toEqual(USelection.single('xxx'));
    expect(
      USelection.toggleSelectionId(USelection.single('xxx'), 'xxx')
    ).toEqual(USelection.none());
  });

  it('#getSelectedFeatures', () => {
    const { featureMap } = wrapMapAndId(fcLineString);
    expect(
      USelection.getSelectedFeatures({
        selection: USelection.none(),
        featureMap
      })
    ).toEqual([]);
    expect(
      USelection.getSelectedFeatures({
        selection: USelection.fromIds(
          [...featureMap.values()].map((f) => f.id)
        ),
        featureMap
      })
    ).toHaveLength(1);
  });

  it('#addSelectionId', () => {
    expect(USelection.addSelectionId(USelection.none(), 'xxx')).toEqual(
      USelection.single('xxx')
    );
    expect(USelection.addSelectionId(USelection.single('xxx'), 'xxx')).toEqual(
      USelection.single('xxx')
    );
  });
});
