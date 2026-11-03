import { assertNonEmpty, assertFinite } from "../internal/validate";
import type { Data, Matrix } from "../internal/types";
import { mean } from "./mean";

export function mode(data: Data): number[] {
  assertNonEmpty(data, "mode");
  const counts = new Map<number, number>();
  let maxCount = 0;
  for (const value of data) {
    assertFinite(value, "data value", "mode");
    const count = (counts.get(value) ?? 0) + 1;
    counts.set(value, count);
    maxCount = Math.max(maxCount, count);
  }
  return [...counts]
    .filter(([, count]) => count === maxCount)
    .map(([value]) => value)
    .sort((a, b) => a - b);
}

export function skewness(data: Data): number {
  const { deviations, standardDeviation } = momentsInput(data, "skewness");
  if (standardDeviation === 0) throw new RangeError("skewness: data must have non-zero variance");
  const n = data.length;
  return deviations.reduce((sum, value) => sum + (value / standardDeviation) ** 3, 0) / n;
}

export function kurtosis(data: Data): number {
  const { deviations, standardDeviation } = momentsInput(data, "kurtosis");
  if (standardDeviation === 0) throw new RangeError("kurtosis: data must have non-zero variance");
  const n = data.length;
  return (
    deviations.reduce((sum, value) => sum + (value / standardDeviation) ** 4, 0) / n - 3
  );
}

export function zscore(data: Data): number[] {
  const { deviations, standardDeviation } = momentsInput(data, "zscore");
  if (standardDeviation === 0) throw new RangeError("zscore: data must have non-zero variance");
  return deviations.map((value) => value / standardDeviation);
}

export function covarianceMatrix(data: Matrix, sample = true): number[][] {
  if (data.length === 0) throw new RangeError("covarianceMatrix: data cannot be empty");
  const columns = data[0]!.length;
  if (columns === 0 || data.some((row) => row.length !== columns)) {
    throw new RangeError("covarianceMatrix: rows must have the same non-zero number of columns");
  }
  const divisor = sample ? data.length - 1 : data.length;
  if (divisor <= 0) {
    throw new RangeError("covarianceMatrix: at least two observations required for sample covariance");
  }
  for (const row of data) {
    for (const value of row) assertFinite(value, "data value", "covarianceMatrix");
  }
  const means = Array.from({ length: columns }, (_, column) =>
    mean(data.map((row) => row[column]!))
  );
  return Array.from({ length: columns }, (_, i) =>
    Array.from({ length: columns }, (_, j) => {
      let total = 0;
      for (const row of data) {
        total += (row[i]! - means[i]!) * (row[j]! - means[j]!);
      }
      return total / divisor;
    })
  );
}

function momentsInput(data: Data, fn: string): {
  deviations: number[];
  standardDeviation: number;
} {
  assertNonEmpty(data, fn);
  for (const value of data) assertFinite(value, "data value", fn);
  const average = mean(data);
  const deviations = data.map((value) => value - average);
  const variance = deviations.reduce((sum, value) => sum + value * value, 0) / data.length;
  return { deviations, standardDeviation: Math.sqrt(variance) };
}
