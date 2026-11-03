import { assertNonEmpty } from "../internal/validate";
import type { Data } from "../internal/types";

/**
 * Computes the arithmetic mean of a dataset.
 *
 * @param {Data} data - A non-empty readonly array of numbers (`number[]`).
 * @returns {number} The arithmetic mean.
 *
 * @example
 * ```ts
 * const values: number[] = [1, 2, 3, 4, 5];
 * const result = mean(values);
 * console.log(result); // => 3
 * ```
 */
export function mean(data: Data): number {
  assertNonEmpty(data, "mean");
  let s = 0;
  for (const x of data) {
    s += x;
  }
  return s / data.length;
}
