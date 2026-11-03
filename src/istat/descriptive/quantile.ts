import { assertNonEmpty, assertInRange } from "../internal/validate";
import type { Data } from "../internal/types";

export type QuantileMethod =
  | "linear" // R-7, NumPy default
  | "lower"
  | "higher"
  | "nearest"
  | "midpoint";

export interface QuantileOptions {
  /**
   * The interpolation method to use when the desired quantile lies between two data points.
   * Defaults to `"linear"`.
   */
  method?: QuantileMethod;
}

/**
 * Computes the quantile for a given probability `p` (where `0 <= p <= 1`).
 *
 * @param {Data} data - A non-empty readonly array of numbers (`number[]`).
 * @param {number} p - The probability between 0 and 1 inclusive (`p ∈ [0, 1]`).
 * @param {QuantileOptions} [options={}] - Options specifying the interpolation method.
 * @returns {number} The quantile value.
 *
 * @example
 * ```ts
 * const data: number[] = [3, 6, 7, 8, 8, 10, 13, 15, 16, 20];
 *
 * // 50th percentile (median)
 * const q50 = quantile(data, 0.5); // => 9.0
 *
 * // 25th percentile (Q1)
 * const q25 = quantile(data, 0.25); // => 7.25
 *
 * // 75th percentile (Q3) using nearest integer method
 * const q75Nearest = quantile(data, 0.75, { method: "nearest" }); // => 15.0
 * ```
 */
export function quantile(
  data: Data,
  p: number,
  options: QuantileOptions = {}
): number {
  assertNonEmpty(data, "quantile");
  assertInRange(p, 0, 1, "p", "quantile");

  const { method = "linear" } = options;
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 1) return sorted[0]!;

  const index = (n - 1) * p;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  const valLower = sorted[lowerIndex]!;
  const valUpper = sorted[upperIndex]!;

  if (lowerIndex === upperIndex) {
    return valLower;
  }

  switch (method) {
    case "lower":
      return valLower;
    case "higher":
      return valUpper;
    case "nearest":
      return Math.round(index) === lowerIndex ? valLower : valUpper;
    case "midpoint":
      return (valLower + valUpper) / 2;
    case "linear":
    default: {
      const weight = index - lowerIndex;
      return valLower + weight * (valUpper - valLower);
    }
  }
}
