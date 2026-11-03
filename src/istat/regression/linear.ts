import { mean } from "../descriptive/mean";
import { assertEqualLengths, assertMinLength } from "../internal/validate";
import type { Data, LinearRegressionResult } from "../internal/types";

/**
 * Fits a simple linear regression model using Ordinary Least Squares (OLS):
 * `y = slope * x + intercept`
 *
 * @param {Data} x - Independent variable data array (`number[]`).
 * @param {Data} y - Dependent variable data array (`number[]`). Must have identical length to `x`.
 * @returns {LinearRegressionResult} An object containing `slope`, `intercept`, coefficient of determination `r2`, and a `predict(x: number): number` helper function.
 *
 * @example
 * ```ts
 * const x: number[] = [1, 2, 3, 4, 5];
 * const y: number[] = [3, 5, 7, 9, 11]; // Exact relationship: y = 2x + 1
 *
 * const model = linearRegression(x, y);
 *
 * console.log(model.slope);     // => 2.0
 * console.log(model.intercept); // => 1.0
 * console.log(model.r2);        // => 1.0
 * console.log(model.predict(6));// => 13.0 (2 * 6 + 1)
 * ```
 */
export function linearRegression(x: Data, y: Data): LinearRegressionResult {
  assertEqualLengths(x, y, "linearRegression");
  assertMinLength(x, 2, "linearRegression");

  const mx = mean(x);
  const my = mean(y);
  const n = x.length;

  let num = 0;
  let den = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i]!;
    const yi = y[i]!;
    const dx = xi - mx;
    const dy = yi - my;
    num += dx * dy;
    den += dx * dx;
    ssTot += dy * dy;
  }

  if (den === 0) {
    throw new RangeError("linearRegression: variance of x values cannot be 0");
  }

  const slope = num / den;
  const intercept = my - slope * mx;

  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * x[i]! + intercept;
    const diff = y[i]! - yPred;
    ssRes += diff * diff;
  }

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return {
    slope,
    intercept,
    r2,
    predict(xVal: number): number {
      return slope * xVal + intercept;
    },
  };
}
