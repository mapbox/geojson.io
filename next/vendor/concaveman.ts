/* eslint-disable @typescript-eslint/no-unsafe-argument */
import RBush from 'rbush';
import Queue from './tinyqueue';
import { GeometryError } from 'app/lib/errors';
import { orient2d } from './orient2d';
import { coordEach } from '@turf/meta';
import type { IFeature, Polygon } from 'types';
import { polygon } from '@turf/helpers';
import type { Either } from 'purify-ts/Either';
import { Left, Right } from 'purify-ts/Either';

interface Bbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface LinkedNode extends Bbox {
  p: Pos2;
  prev: LinkedNode | null;
  next: LinkedNode | null;
  children?: [LinkedNode];
}

interface QueueItem {
  node: Pos2;
  dist: number;
}

const error = new GeometryError(
  'Could not generate convex hull: three points are required'
);

/* eslint @typescript-eslint/no-explicit-any: 0 */
export function convex(geojson: any): Either<Error, IFeature<Polygon>> {
  // Default parameters
  // Container
  const points: Pos2[] = [];
  // Convert all points to flat 2D coordinate Array
  coordEach(geojson, function (coord) {
    points.push([coord[0], coord[1]]);
  });
  if (!points.length) {
    return Left(error);
  }
  try {
    const convexHull = concaveman(points, Infinity);
    // Convex hull should have at least 3 different vertices in order to create a valid polygon
    if (convexHull.length > 3) {
      return Right(polygon([convexHull]));
    }
  } catch (e) {
    return Left(error);
  }
  return Left(error);
}

function pointInPolygonFlat(
  point: Pos2,
  vs: Pos2,
  start?: number,
  end?: number
) {
  const x = point[0],
    y = point[1];
  let inside = false;
  if (start === undefined) start = 0;
  if (end === undefined) end = vs.length;
  const len = (end - start) / 2;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const xi = vs[start + i * 2 + 0],
      yi = vs[start + i * 2 + 1];
    const xj = vs[start + j * 2 + 0],
      yj = vs[start + j * 2 + 1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonNested(
  point: Pos2,
  vs: Pos2[],
  start?: number,
  end?: number
) {
  const x = point[0],
    y = point[1];
  let inside = false;
  if (start === undefined) start = 0;
  if (end === undefined) end = vs.length;
  const len = end - start;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const xi = vs[i + start][0],
      yi = vs[i + start][1];
    const xj = vs[j + start][0],
      yj = vs[j + start][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(
  point: Pos2,
  vs: Pos2 | Pos2[],
  start?: number,
  end?: number
) {
  if (vs.length > 0 && Array.isArray(vs[0])) {
    return pointInPolygonNested(point, vs as Pos2[], start, end);
  } else {
    return pointInPolygonFlat(point, vs as Pos2, start, end);
  }
}

function concaveman(
  points: Pos2[],
  concavity?: number,
  lengthThreshold?: number
) {
  // a relative measure of concavity; higher value means simpler hull
  concavity = Math.max(0, concavity === undefined ? 2 : concavity);

  // when a segment goes below this length threshold, it won't be drilled down further
  lengthThreshold = lengthThreshold || 0;

  // start with a convex hull of the points
  const hull = fastConvexHull(points);

  // index the points with an R-tree
  const tree = new RBush<Pos2>(16);
  tree.toBBox = function (a: Pos2) {
    return {
      minX: a[0],
      minY: a[1],
      maxX: a[0],
      maxY: a[1]
    };
  };
  tree.compareMinX = function (a: Pos2, b: Pos2) {
    return a[0] - b[0];
  };
  tree.compareMinY = function (a: Pos2, b: Pos2) {
    return a[1] - b[1];
  };

  tree.load(points);

  let last: any;

  // turn the convex hull into a linked list and populate the initial edge queue with the nodes
  const queue: LinkedNode[] = [];
  for (let i = 0; i < hull.length; i++) {
    const p = hull[i];
    tree.remove(p);
    last = insertNode(p, last);
    queue.push(last);
  }

  // index the segments with an R-tree (for intersection checks)
  const segTree = new RBush<LinkedNode>(16);
  for (let i = 0; i < queue.length; i++) segTree.insert(updateBBox(queue[i]));

  const sqConcavity = concavity * concavity;
  const sqLenThreshold = lengthThreshold * lengthThreshold;

  // process edges one by one
  while (queue.length) {
    const node = queue.shift();
    if (node == undefined) throw new Error('This should never happen');
    const a = node.p;
    const b = node.next?.p;

    // skip the edge if it's already short enough
    const sqLen = getSqDist(a, b!);
    if (sqLen < sqLenThreshold) continue;

    const maxSqLen = sqLen / sqConcavity;

    // find the best connection point for the current edge to flex inward to
    const p = findCandidate(
      tree,
      node.prev!.p,
      a,
      b!,
      node.next!.next!.p,
      maxSqLen,
      segTree
    )!;

    // if we found a connection and it satisfies our concavity measure
    if (p && Math.min(getSqDist(p, a), getSqDist(p, b!)) <= maxSqLen) {
      // connect the edge endpoints through this point and add 2 new edges to the queue
      queue.push(node);
      queue.push(insertNode(p, node));

      // update point and segment indexes
      tree.remove(p);
      segTree.remove(node);
      segTree.insert(updateBBox(node));
      segTree.insert(updateBBox(node.next!));
    }
  }

  // convert the resulting hull linked list to an array of points
  let node = last;
  const concave: Pos2[] = [];
  do {
    if (!node) throw new Error('This should never happen');
    concave.push(node.p);
    node = node.next!;
  } while (node !== last);

  if (!node) throw new Error('This should never happen');
  concave.push(node.p);

  return concave;
}

function findCandidate(
  tree: any,
  a: Pos2,
  b: Pos2,
  c: Pos2,
  d: Pos2,
  maxDist: number,
  segTree: RBush<LinkedNode>
) {
  const queue = new Queue<QueueItem>([], compareDist);
  let node = tree.data;

  // search through the point R-tree with a depth-first search using a priority queue
  // in the order of distance to the edge (b, c)
  while (node) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      const dist = node.leaf
        ? sqSegDist(child, b, c)
        : sqSegBoxDist(b, c, child);
      if (dist > maxDist) continue; // skip the node if it's farther than we ever need

      queue.push({
        node: child,
        dist: dist
      });
    }

    while (queue.length && !(queue.peek().node as any).children) {
      const item = queue.pop()!;
      const p = item.node;

      // skip all points that are as close to adjacent edges (a,b) and (c,d),
      // and points that would introduce self-intersections when connected
      const d0 = sqSegDist(p, a, b);
      const d1 = sqSegDist(p, c, d);
      if (
        item.dist < d0 &&
        item.dist < d1 &&
        noIntersections(b, p, segTree) &&
        noIntersections(c, p, segTree)
      )
        return p;
    }

    node = queue.pop();
    if (node) node = node.node;
  }

  return null;
}

function compareDist(a: QueueItem, b: QueueItem) {
  return a.dist - b.dist;
}

// square distance from a segment bounding box to the given one
function sqSegBoxDist(a: Pos2, b: Pos2, bbox: any) {
  if (inside(a, bbox) || inside(b, bbox)) return 0;
  const d1 = sqSegSegDist(
    a[0],
    a[1],
    b[0],
    b[1],
    bbox.minX,
    bbox.minY,
    bbox.maxX,
    bbox.minY
  );
  if (d1 === 0) return 0;
  const d2 = sqSegSegDist(
    a[0],
    a[1],
    b[0],
    b[1],
    bbox.minX,
    bbox.minY,
    bbox.minX,
    bbox.maxY
  );
  if (d2 === 0) return 0;
  const d3 = sqSegSegDist(
    a[0],
    a[1],
    b[0],
    b[1],
    bbox.maxX,
    bbox.minY,
    bbox.maxX,
    bbox.maxY
  );
  if (d3 === 0) return 0;
  const d4 = sqSegSegDist(
    a[0],
    a[1],
    b[0],
    b[1],
    bbox.minX,
    bbox.maxY,
    bbox.maxX,
    bbox.maxY
  );
  if (d4 === 0) return 0;
  return Math.min(d1, d2, d3, d4);
}

function inside(a: Pos2, bbox: any) {
  return (
    a[0] >= bbox.minX &&
    a[0] <= bbox.maxX &&
    a[1] >= bbox.minY &&
    a[1] <= bbox.maxY
  );
}

// check if the edge (a,b) doesn't intersect any other edges
function noIntersections(a: Pos2, b: Pos2, segTree: RBush<LinkedNode>) {
  const minX = Math.min(a[0], b[0]);
  const minY = Math.min(a[1], b[1]);
  const maxX = Math.max(a[0], b[0]);
  const maxY = Math.max(a[1], b[1]);

  const edges = segTree.search({
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY
  });
  for (let i = 0; i < edges.length; i++) {
    if (intersects(edges[i].p, edges[i].next!.p, a, b)) return false;
  }
  return true;
}

function cross(p1: Pos2, p2: Pos2, p3: Pos2) {
  return orient2d(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
}

// check if the edges (p1,q1) and (p2,q2) intersect
function intersects(p1: Pos2, q1: Pos2, p2: Pos2, q2: Pos2) {
  return (
    p1 !== q2 &&
    q1 !== p2 &&
    cross(p1, q1, p2) > 0 !== cross(p1, q1, q2) > 0 &&
    cross(p2, q2, p1) > 0 !== cross(p2, q2, q1) > 0
  );
}

// update the bounding box of a node's edge
function updateBBox(node: LinkedNode) {
  const p1 = node.p;
  const p2 = node.next!.p;
  node.minX = Math.min(p1[0], p2[0]);
  node.minY = Math.min(p1[1], p2[1]);
  node.maxX = Math.max(p1[0], p2[0]);
  node.maxY = Math.max(p1[1], p2[1]);
  return node;
}

// speed up convex hull by filtering out points inside quadrilateral formed by 4 extreme points
function fastConvexHull(points: Pos2[]) {
  let left = points[0];
  let top = points[0];
  let right = points[0];
  let bottom = points[0];

  // find the leftmost, rightmost, topmost and bottommost points
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p[0] < left[0]) left = p;
    if (p[0] > right[0]) right = p;
    if (p[1] < top[1]) top = p;
    if (p[1] > bottom[1]) bottom = p;
  }

  // filter out points that are inside the resulting quadrilateral
  const cull = [left, top, right, bottom];
  const filtered = cull.slice();
  for (let i = 0; i < points.length; i++) {
    if (!pointInPolygon(points[i], cull)) filtered.push(points[i]);
  }

  // get convex hull around the filtered points
  return convexHull(filtered);
}

// create a new node in a doubly linked list
function insertNode(p: Pos2, prev: LinkedNode) {
  const node: LinkedNode = {
    p: p,
    prev: null,
    next: null,
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0
  };

  if (!prev) {
    node.prev = node;
    node.next = node;
  } else {
    node.next = prev.next;
    node.prev = prev;
    prev.next!.prev = node;
    prev.next = node;
  }
  return node;
}

// square distance between 2 points
function getSqDist(p1: Pos2, p2: Pos2) {
  const dx = p1[0] - p2[0],
    dy = p1[1] - p2[1];

  return dx * dx + dy * dy;
}

// square distance from a point to a segment
function sqSegDist(p: Pos2, p1: Pos2, p2: Pos2) {
  let x = p1[0],
    y = p1[1],
    dx = p2[0] - x,
    dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;
}

// segment to segment distance, ported from http://geomalgorithms.com/a07-_distance.html by Dan Sunday
function sqSegSegDist(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
) {
  const ux = x1 - x0;
  const uy = y1 - y0;
  const vx = x3 - x2;
  const vy = y3 - y2;
  const wx = x0 - x2;
  const wy = y0 - y2;
  const a = ux * ux + uy * uy;
  const b = ux * vx + uy * vy;
  const c = vx * vx + vy * vy;
  const d = ux * wx + uy * wy;
  const e = vx * wx + vy * wy;
  const D = a * c - b * b;

  let sN, tN;
  let sD = D;
  let tD = D;

  if (D === 0) {
    sN = 0;
    sD = 1;
    tN = e;
    tD = c;
  } else {
    sN = b * e - c * d;
    tN = a * e - b * d;
    if (sN < 0) {
      sN = 0;
      tN = e;
      tD = c;
    } else if (sN > sD) {
      sN = sD;
      tN = e + b;
      tD = c;
    }
  }

  if (tN < 0.0) {
    tN = 0.0;
    if (-d < 0.0) sN = 0.0;
    else if (-d > a) sN = sD;
    else {
      sN = -d;
      sD = a;
    }
  } else if (tN > tD) {
    tN = tD;
    if (-d + b < 0.0) sN = 0;
    else if (-d + b > a) sN = sD;
    else {
      sN = -d + b;
      sD = a;
    }
  }

  const sc = sN === 0 ? 0 : sN / sD;
  const tc = tN === 0 ? 0 : tN / tD;

  const cx = (1 - sc) * x0 + sc * x1;
  const cy = (1 - sc) * y0 + sc * y1;
  const cx2 = (1 - tc) * x2 + tc * x3;
  const cy2 = (1 - tc) * y2 + tc * y3;
  const dx = cx2 - cx;
  const dy = cy2 - cy;

  return dx * dx + dy * dy;
}

function compareByX(a: Pos2, b: Pos2) {
  return a[0] === b[0] ? a[1] - b[1] : a[0] - b[0];
}

function convexHull(points: Pos2[]) {
  points.sort(compareByX);

  const lower = [];
  for (let i = 0; i < points.length; i++) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0
    ) {
      lower.pop();
    }
    lower.push(points[i]);
  }

  const upper = [];
  for (let ii = points.length - 1; ii >= 0; ii--) {
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], points[ii]) <= 0
    ) {
      upper.pop();
    }
    upper.push(points[ii]);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}
