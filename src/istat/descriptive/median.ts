import { assertNonEmpty } from "../internal/validate";
import { quickselect } from "../sorting/quickselect";
import type { Data } from "../internal/types";

/**
 * Computes the median (middle value) of a dataset.
 * Uses the quickselect algorithm with average O(n) runtime and does not mutate the input array.
 *
 * @param {Data} data - A non-empty readonly array of numbers (`number[]`).
 * @returns {number} The median value.
 *
 * @example
 * ```ts
 * // Odd number of elements
 * const odd: number[] = [5, 1, 3];
 * console.log(median(odd)); // => 3
 *
 * // Even number of elements (average of two middle values)
 * const even: number[] = [1, 2, 3, 4];
 * console.log(median(even)); // => 2.5
 * ```
 */
export function median(data: Data): number {
  assertNonEmpty(data, "median");
  const copy = [...data];
  const n = copy.length;
  const mid = Math.floor(n / 2);

  if (n % 2 !== 0) {
    return quickselect(copy, mid);
  }

  const right = quickselect(copy, mid);
  const left = quickselect(copy, mid - 1);
  return (left + right) / 2;
}
