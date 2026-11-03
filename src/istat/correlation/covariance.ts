import { mean } from "../descriptive/mean";
import { assertEqualLengths, assertMinLength } from "../internal/validate";
import type { Data } from "../internal/types";

/**
 * Computes the covariance between two variables.
 * @param sample If true, computes sample covariance (divided by n-1); if false, computes population covariance (divided by n).
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
