import { covariance } from "./covariance";
import { stdev } from "../descriptive/stdev";
import type { Data } from "../internal/types";

/**
 * Computes Pearson's correlation coefficient (r) between two variables (-1 <= r <= 1).
 */
export function pearson(x: Data, y: Data): number {
  const cov = covariance(x, y, true);
  const sx = stdev(x, true);
  const sy = stdev(y, true);

  if (sx === 0 || sy === 0) return NaN;
  return cov / (sx * sy);
}
