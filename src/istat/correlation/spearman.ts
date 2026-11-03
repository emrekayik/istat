import { pearson } from "./pearson";
import { assertEqualLengths, assertMinLength } from "../internal/validate";
import type { Data } from "../internal/types";

/**
 * Computes rank array (assigns average rank for ties).
 */
function rank(data: Data): number[] {
  const n = data.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort((a, b) => data[a]! - data[b]!);

  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && data[indices[j]!] === data[indices[j + 1]!]) {
      j++;
    }
    const avgRank = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) {
      ranks[indices[k]!] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

/**
 * Computes Spearman's rank correlation coefficient between two paired numerical datasets.
 * Measures monotonic relationships regardless of whether they are linear.
 *
 * @param {Data} x - First array of numbers (`number[]`).
 * @param {Data} y - Second array of numbers (`number[]`). Must have identical length to `x`.
 * @returns {number} Spearman rank correlation coefficient (`-1 <= rho <= 1`).
 *
 * @example
 * ```ts
 * const x: number[] = [1, 2, 3, 4, 5];
 * const y: number[] = [10, 20, 50, 100, 500]; // Monotonic non-linear growth
 *
 * const rho = spearman(x, y);
 * console.log(rho); // => 1.0 (perfect monotonic rank correlation)
 * ```
 */
export function spearman(x: Data, y: Data): number {
  assertEqualLengths(x, y, "spearman");
  assertMinLength(x, 2, "spearman");

  const rankX = rank(x);
  const rankY = rank(y);
  return pearson(rankX, rankY);
}
