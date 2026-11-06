import { logGamma } from "./special";
import { assertInteger } from "./validation";

/**
 * Evaluates the probability mass function of the Poisson distribution.
 *
 * @param k - Number of events.
 * @param rate - Average event rate (lambda).
 */
export function poissonPmf(k: number, rate: number): number {
  assertInteger(k, "k", "poissonPmf");
  if (k < 0) return 0;
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError(
      "poissonPmf: rate must be a non-negative finite number"
    );
  }
  if (rate === 0) return k === 0 ? 1 : 0;
  return Math.exp(k * Math.log(rate) - rate - logGamma(k + 1));
}

/**
 * Evaluates the cumulative distribution function of the Poisson distribution.
 *
 * @param k - Inclusive upper bound for the number of events.
 * @param rate - Average event rate (lambda).
 */
export function poissonCdf(k: number, rate: number): number {
  assertInteger(k, "k", "poissonCdf");
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError(
      "poissonCdf: rate must be a non-negative finite number"
    );
  }
  if (k < 0) return 0;
  let total = 0;
  for (let i = 0; i <= k; i++) total += poissonPmf(i, rate);
  return Math.min(1, total);
}
