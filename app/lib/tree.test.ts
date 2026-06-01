import { describe, expect, it } from 'vitest';
import { buildTree, pullNode } from './tree';

interface Leaf {
  id: string;
  parentId: string | null;
}

interface Container {
  id: string;
  parentId: string | null;
}

describe('buildTree', () => {
  it('base case', () => {
    const containers: Container[] = [
      {
        id: '1',
        parentId: null
      }
    ];

    const leafs: Leaf[] = [
      {
        id: '1',
        parentId: null
      }
    ];
    expect(
      buildTree({
        containers,
        containerIdMember: 'id',
        containerParentMember: 'parentId',
        leafs,
        leafParentMember: 'parentId'
      })
    ).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "data": {
              "id": "1",
              "parentId": null,
            },
            "type": "leaf",
          },
          {
            "children": [],
            "data": {
              "id": "1",
              "parentId": null,
            },
            "type": "container",
          },
        ],
        "type": "root",
      }
    `);
  });

  it('nesting', () => {
    const containers: Container[] = [
      {
        id: '1',
        parentId: null
      },
      {
        id: '2',
        parentId: '1'
      }
    ];

    const leafs: Leaf[] = [
      {
        id: '1',
        parentId: '2'
      }
    ];
    const tree = buildTree({
      containers,
      containerIdMember: 'id',
      containerParentMember: 'parentId',
      leafs,
      leafParentMember: 'parentId'
    });
    expect(tree).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "children": [
              {
                "children": [
                  {
                    "data": {
                      "id": "1",
                      "parentId": "2",
                    },
                    "type": "leaf",
                  },
                ],
                "data": {
                  "id": "2",
                  "parentId": "1",
                },
                "type": "container",
              },
            ],
            "data": {
              "id": "1",
              "parentId": null,
            },
            "type": "container",
          },
        ],
        "type": "root",
      }
    `);
    const node2 = pullNode(tree, 'id', '2');
    expect(node2).toMatchInlineSnapshot(`
      {
        "node": {
          "children": [
            {
              "data": {
                "id": "1",
                "parentId": "2",
              },
              "type": "leaf",
            },
          ],
          "data": {
            "id": "2",
            "parentId": "1",
          },
          "type": "container",
        },
        "path": [
          {
            "children": [
              {
                "children": [
                  {
                    "data": {
                      "id": "1",
                      "parentId": "2",
                    },
                    "type": "leaf",
                  },
                ],
                "data": {
                  "id": "2",
                  "parentId": "1",
                },
                "type": "container",
              },
            ],
            "data": {
              "id": "1",
              "parentId": null,
            },
            "type": "container",
          },
          {
            "children": [
              {
                "data": {
                  "id": "1",
                  "parentId": "2",
                },
                "type": "leaf",
              },
            ],
            "data": {
              "id": "2",
              "parentId": "1",
            },
            "type": "container",
          },
        ],
      }
    `);
  });
});
