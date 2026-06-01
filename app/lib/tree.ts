interface RootNode<Container, Leaf> {
  type: 'root';
  children: Array<LeafNode<Leaf> | ContainerNode<Container, Leaf>>;
}

export interface LeafNode<Leaf> {
  type: 'leaf';
  data: Leaf;
}

export interface ContainerNode<Container, Leaf> {
  type: 'container';
  data: Container;
  children: Array<LeafNode<Leaf> | ContainerNode<Container, Leaf>>;
}

function makeIndex<X>(items: X[], idMember: keyof X) {
  const m = new Map<null | string, X[]>();

  for (const item of items) {
    const id = item[idMember] as string | null;
    const list = m.get(id) || [];
    list.push(item);
    m.set(id, list);
  }

  return m;
}

/**
 * Find a container node with idMember=id.
 */
export function pullNode<Container, Leaf>(
  tree: RootNode<Container, Leaf>,
  idMember: keyof Container,
  id: string
) {
  type ChildType = LeafNode<Leaf> | ContainerNode<Container, Leaf>;
  type Path = ContainerNode<Container, Leaf>[];

  let res: ContainerNode<Container, Leaf> | null = null;
  let path: Path | null = null;

  function findNode(
    node: ChildType,
    idMember: keyof Container,
    id: string,
    _path: Path
  ) {
    if (node.type === 'container') {
      _path = _path.concat(node);
      if (node.data[idMember] === id) {
        res = node;
        path = _path;
      } else {
        for (const c of node.children) {
          if (c.type === 'container') {
            findNode(c, idMember, id, _path);
          }
        }
      }
    }
  }

  for (const child of tree.children) {
    findNode(child, idMember, id, []);
  }

  return res
    ? {
        node: res as ContainerNode<Container, Leaf>,
        path: path as Path | null
      }
    : null;
}

/**
 * Build a tree from two collections of parent-linked
 * items. This could be expanded to support "n" different kinds of things.
 */
export function buildTree<Container, Leaf>({
  containers,
  containerIdMember,
  containerParentMember,
  leafs,
  leafParentMember
}: {
  containers: Container[];
  containerParentMember: keyof Container;
  containerIdMember: keyof Container;
  leafs: Leaf[];
  leafParentMember: keyof Leaf;
}): RootNode<Container, Leaf> {
  const containerParentIndex = makeIndex(containers, containerParentMember);
  const leafParentIndex = makeIndex(leafs, leafParentMember);

  type ChildType = LeafNode<Leaf> | ContainerNode<Container, Leaf>;

  const rootChildren: ChildType[] = [];

  for (const leaf of leafs) {
    if (leaf[leafParentMember] === null) {
      rootChildren.push(toLeaf(leaf));
    }
  }

  for (const container of containers) {
    if (container[containerParentMember] === null) {
      rootChildren.push({
        type: 'container',
        data: container,
        children: getChildren(container)
      });
    }
  }

  return {
    type: 'root',
    children: rootChildren
  };

  function toLeaf(leaf: Leaf): LeafNode<Leaf> {
    return {
      type: 'leaf',
      data: leaf
    };
  }

  function getChildren(container: Container): ChildType[] {
    const id = container[containerIdMember] as string;
    const containers = containerParentIndex.get(id) || [];
    const leafs = leafParentIndex.get(id) || [];

    const leafNodes = leafs.map(toLeaf);

    const containerNodes = containers.map(
      (container): ContainerNode<Container, Leaf> => {
        return {
          type: 'container',
          data: container,
          children: getChildren(container)
        };
      }
    );

    return ([] as ChildType[]).concat(leafNodes).concat(containerNodes);
  }
}
