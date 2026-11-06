import { assertInRange } from "../internal/validate";
import { logGamma } from "./special";
import { assertInteger } from "./validation";

/**
 * Evaluates the probability mass function of the binomial distribution.
 *
 * @param k - Number of successes.
 * @param trials - Total number of independent trials.
 * @param probability - Success probability for each trial.
 */
export function binomialPmf(
  k: number,
  trials: number,
  probability: number
): number {
  assertInteger(trials, "trials", "binomialPmf");
  if (trials < 0) {
    throw new RangeError("binomialPmf: trials must be non-negative");
  }
  assertInRange(probability, 0, 1, "probability", "binomialPmf");
  assertInteger(k, "k", "binomialPmf");
  if (k < 0 || k > trials) return 0;
  if (probability === 0) return k === 0 ? 1 : 0;
  if (probability === 1) return k === trials ? 1 : 0;
  return Math.exp(
    logGamma(trials + 1) -
      logGamma(k + 1) -
      logGamma(trials - k + 1) +
      k * Math.log(probability) +
      (trials - k) * Math.log1p(-probability)
  );
}

/**
 * Evaluates the cumulative distribution function of the binomial distribution.
 *
 * @param k - Inclusive upper bound for the number of successes.
 * @param trials - Total number of independent trials.
 * @param probability - Success probability for each trial.
 */
export function binomialCdf(
  k: number,
  trials: number,
  probability: number
): number {
  assertInteger(k, "k", "binomialCdf");
  assertInteger(trials, "trials", "binomialCdf");
  if (trials < 0) {
    throw new RangeError("binomialCdf: trials must be non-negative");
  }
  assertInRange(probability, 0, 1, "probability", "binomialCdf");
  if (k < 0) return 0;
  if (k >= trials) return 1;
  let total = 0;
  for (let i = 0; i <= k; i++) {
    total += binomialPmf(i, trials, probability);
  }
  return Math.min(1, total);
}
