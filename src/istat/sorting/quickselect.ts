/**
 * Quickselect algorithm: Finds the k-th smallest element in an array (0-indexed).
 * Average time complexity: O(n).
 * Note: This function may partially mutate the given array in-place.
 */
export function quickselect(
  arr: number[],
  k: number,
  left = 0,
  right = arr.length - 1
): number {
  if (k < 0 || k >= arr.length) {
    throw new RangeError(`quickselect: invalid k index (${k})`);
  }

  while (right > left) {
    const pivotIndex = partition(arr, left, right);
    if (k === pivotIndex) {
      const val = arr[k];
      if (val === undefined) throw new RangeError("quickselect: out of bounds access");
      return val;
    } else if (k < pivotIndex) {
      right = pivotIndex - 1;
    } else {
      left = pivotIndex + 1;
    }
  }

  const result = arr[left];
  if (result === undefined) {
    throw new RangeError("quickselect: out of bounds access");
  }
  return result;
}

function partition(arr: number[], left: number, right: number): number {
  const mid = (left + right) >> 1;
  const pivot = arr[mid]!;
  swap(arr, mid, right);

  let store = left;
  for (let i = left; i < right; i++) {
    if (arr[i]! < pivot) {
      swap(arr, i, store);
      store++;
    }
  }
  swap(arr, store, right);
  return store;
}

function swap(arr: number[], i: number, j: number): void {
  const tmp = arr[i]!;
  arr[i] = arr[j]!;
  arr[j] = tmp;
}
