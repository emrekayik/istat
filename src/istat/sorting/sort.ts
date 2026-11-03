import type { Data } from "../internal/types";

/**
 * Returns a new sorted copy of the given numeric array (does not mutate the original array).
 *
 * @param {Data} data - A readonly array of numbers (`number[]`).
 * @param {boolean} [ascending=true] - If `true`, sorts ascending (smallest to largest); if `false`, sorts descending.
 * @returns {number[]} A new array sorted in the requested order.
 *
 * @example
 * ```ts
 * const input: number[] = [5, 2, 8, 1, 9];
 *
 * const asc = numericSort(input);
 * console.log(asc); // => [1, 2, 5, 8, 9]
 *
 * const desc = numericSort(input, false);
 * console.log(desc); // => [9, 8, 5, 2, 1]
 *
 * // Input array remains unchanged:
 * console.log(input); // => [5, 2, 8, 1, 9]
 * ```
 */
export function numericSort(data: Data, ascending = true): number[] {
  const copy = [...data];
  return ascending ? copy.sort((a, b) => a - b) : copy.sort((a, b) => b - a);
}
