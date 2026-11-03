import { mean } from "./mean";
import { assertMinLength } from "../internal/validate";
import type { Data } from "../internal/types";

/**
 * Computes the variance of a dataset.
 *
 * @param {Data} data - A readonly array of numbers (`number[]`). Requires n >= 2 for sample or n >= 1 for population.
 * @param {boolean} [sample=true] - If `true`, computes sample variance (divided by n - 1); if `false`, computes population variance (divided by n).
 * @returns {number} The calculated variance.
 *
 * @example
 * ```ts
 * const data: number[] = [2, 4, 4, 4, 5, 5, 7, 9];
 *
 * // Sample variance (default: sample = true, divisor = n - 1)
 * const sampleVar = variance(data); // => ~4.5714
 *
 * // Population variance (sample = false, divisor = n)
 * const popVar = variance(data, false); // => 4.0
 * ```
 */
export function variance(data: Data, sample = true): number {
  const n = data.length;
  if (sample) {
    assertMinLength(data, 2, "variance (sample)");
  } else {
    assertMinLength(data, 1, "variance (population)");
  }

  const m = mean(data);
  let ss = 0;
  for (const x of data) {
    const d = x - m;
    ss += d * d;
  }
  return ss / (sample ? n - 1 : n);
}
