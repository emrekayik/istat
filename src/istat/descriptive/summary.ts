import { assertNonEmpty } from "../internal/validate";
import { mean } from "./mean";
import { variance } from "./variance";
import { median } from "./median";
import type { Data, DescriptiveSummary } from "../internal/types";

/**
 * Computes comprehensive summary descriptive statistics for a dataset in a single call.
 *
 * @param {Data} data - A non-empty readonly array of numbers (`number[]`).
 * @returns {DescriptiveSummary} Object containing count, min, max, sum, mean, variance, stdev, and median.
 *
 * @example
 * ```ts
 * const data: number[] = [1, 2, 3, 4, 5];
 * const stats: DescriptiveSummary = summary(data);
 *
 * console.log(stats);
 * // Output:
 * // {
 * //   count: 5,
 * //   min: 1,
 * //   max: 5,
 * //   sum: 15,
 * //   mean: 3,
 * //   variance: 2.5,
 * //   stdev: 1.5811388300841898,
 * //   median: 3
 * // }
 * ```
 */
export function summary(data: Data): DescriptiveSummary {
  assertNonEmpty(data, "summary");

  let min = data[0]!;
  let max = data[0]!;
  let sum = 0;

  for (const x of data) {
    if (x < min) min = x;
    if (x > max) max = x;
    sum += x;
  }

  const m = sum / data.length;
  const v = data.length > 1 ? variance(data, true) : 0;
  const s = Math.sqrt(v);
  const med = median(data);

  return {
    count: data.length,
    min,
    max,
    sum,
    mean: m,
    variance: v,
    stdev: s,
    median: med,
  };
}
