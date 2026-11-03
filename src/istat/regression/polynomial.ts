import { assertEqualLengths, assertMinLength } from "../internal/validate";
import type { Data, PolynomialRegressionResult } from "../internal/types";

/**
 * Polynomial regression: y = a0 + a1*x + a2*x^2 + ...
 * Solves the normal equations using Gaussian elimination.
 */
export function polynomialRegression(
  x: Data,
  y: Data,
  degree = 2
): PolynomialRegressionResult {
  assertEqualLengths(x, y, "polynomialRegression");
  assertMinLength(x, degree + 1, "polynomialRegression");

  const m = degree + 1;
  const n = x.length;

  // Matrix A and vector B: (X^T * X) * w = X^T * y
  const A: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
  const B: number[] = new Array<number>(m).fill(0);

  // Sum of powers of x (from 0 to 2*degree)
  const xPowers: number[] = new Array<number>(2 * degree + 1).fill(0);
  for (let p = 0; p <= 2 * degree; p++) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      s += Math.pow(x[i]!, p);
    }
    xPowers[p] = s;
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      A[i]![j] = xPowers[i + j]!;
    }
    let s = 0;
    for (let k = 0; k < n; k++) {
      s += y[k]! * Math.pow(x[k]!, i);
    }
    B[i] = s;
  }

  // Gauss-Jordan elimination
  const coefficients = solveLinearSystem(A, B);

  // Compute R^2
  let ySum = 0;
  for (const val of y) ySum += val;
  const yMean = ySum / n;

  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i]!;
    const yi = y[i]!;
    let yPred = 0;
    for (let d = 0; d < m; d++) {
      yPred += coefficients[d]! * Math.pow(xi, d);
    }
    ssRes += (yi - yPred) * (yi - yPred);
    ssTot += (yi - yMean) * (yi - yMean);
  }

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return {
    coefficients,
    degree,
    r2,
    predict(xVal: number): number {
      let result = 0;
      for (let d = 0; d < coefficients.length; d++) {
        result += coefficients[d]! * Math.pow(xVal, d);
      }
      return result;
    },
  };
}

function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k]![i]!) > Math.abs(A[maxRow]![i]!)) {
        maxRow = k;
      }
    }

    const tempRow = A[i]!;
    A[i] = A[maxRow]!;
    A[maxRow] = tempRow;

    const tempB = B[i]!;
    B[i] = B[maxRow]!;
    B[maxRow] = tempB;

    const pivot = A[i]![i]!;
    if (Math.abs(pivot) < 1e-12) {
      throw new Error("solveLinearSystem: Singular matrix, no unique solution exists");
    }

    for (let k = i + 1; k < n; k++) {
      const factor = A[k]![i]! / pivot;
      for (let j = i; j < n; j++) {
        A[k]![j] = A[k]![j]! - factor * A[i]![j]!;
      }
      B[k] = B[k]! - factor * B[i]!;
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = B[i]!;
    for (let j = i + 1; j < n; j++) {
      sum -= A[i]![j]! * x[j]!;
    }
    x[i] = sum / A[i]![i]!;
  }
  return x;
}
