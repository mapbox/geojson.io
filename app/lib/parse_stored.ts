export function sortAts<T extends { at: string; id: string }>(
  a: T,
  b: T
): number {
  if (a.at > b.at) {
    return 1;
  } else if (a.at < b.at) {
    return -1;
  } else if (a.id > b.id) {
    // This should never happen, but fall
    // back to it to get stable sorting.
    return 1;
  } else {
    return -1;
  }
}

/**
 * Sort any object with an 'at' by that property
 * BENCH: 0.0735 µs/feature (with 40k features)
 */
export function sortByAt<T extends { at: string; id: string }>(list: T[]): T[] {
  return list.sort((a, b) => {
    if (a.at > b.at) {
      return 1;
    } else if (a.at < b.at) {
      return -1;
    } else if (a.id > b.id) {
      // This should never happen, but fall
      // back to it to get stable sorting.
      return 1;
    } else {
      return -1;
    }
  });
}
