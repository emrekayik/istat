import { mean } from "../descriptive/mean";
import { assertEqualLengths, assertMinLength } from "../internal/validate";
import type { Data } from "../internal/types";

/**
 * Computes the covariance between two paired numerical datasets.
 *
 * @param {Data} x - First array of numbers (`number[]`).
 * @param {Data} y - Second array of numbers (`number[]`). Must have identical length to `x`.
 * @param {boolean} [sample=true] - If `true`, computes sample covariance (divided by n - 1); if `false`, computes population covariance (divided by n).
 * @returns {number} The calculated covariance.
 *
 * @example
 * ```ts
 * const x: number[] = [1, 2, 3, 4, 5];
 * const y: number[] = [2, 4, 6, 8, 10];
 *
 * // Sample covariance (sample = true, divisor = n - 1)
 * const sampleCov = covariance(x, y); // => 5.0
 *
 * // Population covariance (sample = false, divisor = n)
 * const popCov = covariance(x, y, false); // => 4.0
 * ```
 */
export function covariance(x: Data, y: Data, sample = true): number {
  assertEqualLengths(x, y, "covariance");
  if (sample) {
    assertMinLength(x, 2, "covariance (sample)");
  } else {
    assertMinLength(x, 1, "covariance (population)");
  }

  const mx = mean(x);
  const my = mean(y);
  const n = x.length;
  let sum = 0;

  for (let i = 0; i < n; i++) {
    sum += (x[i]! - mx) * (y[i]! - my);
  }

  return sum / (sample ? n - 1 : n);
}
