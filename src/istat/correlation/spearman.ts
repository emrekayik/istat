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
 * Computes Spearman's rank correlation coefficient between two variables.
 */
export function spearman(x: Data, y: Data): number {
  assertEqualLengths(x, y, "spearman");
  assertMinLength(x, 2, "spearman");

  const rankX = rank(x);
  const rankY = rank(y);
  return pearson(rankX, rankY);
}
