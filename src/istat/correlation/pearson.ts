import { covariance } from "./covariance";
import { stdev } from "../descriptive/stdev";
import type { Data } from "../internal/types";

/**
 * Computes Pearson's correlation coefficient (`r`) between two paired numerical datasets (`-1 <= r <= 1`).
 *
 * @param {Data} x - First array of numbers (`number[]`).
 * @param {Data} y - Second array of numbers (`number[]`). Must have identical length to `x`.
 * @returns {number} Pearson correlation coefficient `r`, or `NaN` if variance is zero.
 *
 * @example
 * ```ts
 * const x: number[] = [1, 2, 3, 4, 5];
 * const y: number[] = [2, 4, 6, 8, 10]; // Perfect positive linear relationship
 *
 * const r = pearson(x, y);
 * console.log(r); // => 1.0
 *
 * const negY: number[] = [10, 8, 6, 4, 2]; // Perfect negative linear relationship
 * console.log(pearson(x, negY)); // => -1.0
 * ```
 */
export function pearson(x: Data, y: Data): number {
  const cov = covariance(x, y, true);
  const sx = stdev(x, true);
  const sy = stdev(y, true);

  if (sx === 0 || sy === 0) return NaN;
  return cov / (sx * sy);
}
