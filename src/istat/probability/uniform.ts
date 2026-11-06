import { assertFinite } from "./validation";

/**
 * Evaluates the probability density function of the continuous uniform
 * distribution.
 *
 * @param x - Value at which to evaluate the density.
 * @param min - Lower bound. Defaults to `0`.
 * @param max - Upper bound. Defaults to `1`.
 */
export function uniformPdf(x: number, min = 0, max = 1): number {
  validateUniformBounds(min, max, "uniformPdf");
  assertFinite(x, "x", "uniformPdf");
  return x < min || x > max ? 0 : 1 / (max - min);
}

/**
 * Evaluates the cumulative distribution function of the continuous uniform
 * distribution.
 *
 * @param x - Value at which to evaluate the cumulative probability.
 * @param min - Lower bound. Defaults to `0`.
 * @param max - Upper bound. Defaults to `1`.
 */
export function uniformCdf(x: number, min = 0, max = 1): number {
  validateUniformBounds(min, max, "uniformCdf");
  assertFinite(x, "x", "uniformCdf");
  if (x <= min) return 0;
  if (x >= max) return 1;
  return (x - min) / (max - min);
}

function validateUniformBounds(min: number, max: number, fn: string): void {
  assertFinite(min, "min", fn);
  assertFinite(max, "max", fn);
  if (min >= max) throw new RangeError(`${fn}: max must be greater than min`);
}
