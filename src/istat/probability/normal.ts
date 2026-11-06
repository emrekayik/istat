import { SQRT_TWO_PI, erf } from "./special";
import { assertFinite, assertPositive } from "./validation";

/**
 * Evaluates the probability density function of the normal distribution.
 *
 * @param x - Value at which to evaluate the density.
 * @param mean - Distribution mean. Defaults to `0`.
 * @param standardDeviation - Distribution standard deviation. Defaults to `1`.
 */
export function normalPdf(x: number, mean = 0, standardDeviation = 1): number {
  assertFinite(x, "x", "normalPdf");
  assertFinite(mean, "mean", "normalPdf");
  assertPositive(standardDeviation, "standardDeviation", "normalPdf");
  const z = (x - mean) / standardDeviation;
  return Math.exp(-0.5 * z * z) / (SQRT_TWO_PI * standardDeviation);
}

/**
 * Evaluates the cumulative distribution function of the normal distribution.
 *
 * @param x - Value at which to evaluate the cumulative probability.
 * @param mean - Distribution mean. Defaults to `0`.
 * @param standardDeviation - Distribution standard deviation. Defaults to `1`.
 */
export function normalCdf(x: number, mean = 0, standardDeviation = 1): number {
  assertFinite(x, "x", "normalCdf");
  assertFinite(mean, "mean", "normalCdf");
  assertPositive(standardDeviation, "standardDeviation", "normalCdf");
  const z = (x - mean) / (standardDeviation * Math.sqrt(2));
  return 0.5 * (1 + erf(z));
}
