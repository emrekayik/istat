import { variance } from "./variance";
import type { Data } from "../internal/types";

/**
 * Computes the standard deviation of a dataset.
 *
 * @param {Data} data - A readonly array of numbers (`number[]`). Requires n >= 2 for sample or n >= 1 for population.
 * @param {boolean} [sample=true] - If `true`, computes sample standard deviation (n - 1); if `false`, computes population standard deviation (n).
 * @returns {number} The calculated standard deviation.
 *
 * @example
 * ```ts
 * const data: number[] = [2, 4, 4, 4, 5, 5, 7, 9];
 *
 * // Sample standard deviation (sample = true)
 * const s = stdev(data); // => ~2.138
 *
 * // Population standard deviation (sample = false)
 * const sigma = stdev(data, false); // => 2.0
 * ```
 */
export function stdev(data: Data, sample = true): number {
  return Math.sqrt(variance(data, sample));
}
