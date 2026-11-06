import { assertFinite } from "../internal/validate";
import { median } from "./median";
import { quantile, type QuantileOptions } from "./quantile";

/**
 * Input accepted by the missing-data helpers. `null` and `undefined` are
 * treated as missing so values coming from `readData` can be passed directly.
 */
export type MissingData = readonly (number | null | undefined)[];

type MissingMatrix = readonly (readonly (number | null | undefined)[])[];

function isNaNValue(value: unknown): boolean {
  return typeof value === "number" && Number.isNaN(value);
}

function isMissingValue(value: unknown): boolean {
  return value === null || value === undefined || isNaNValue(value);
}

function isMatrix(data: readonly unknown[]): data is MissingMatrix {
  return data.length > 0 && Array.isArray(data[0]);
}

function toNumber(value: unknown): number {
  if (isMissingValue(value)) return NaN;
  const number = Number(value);
  return Number.isNaN(number) ? NaN : number;
}

function validNumbers(data: readonly unknown[], fn: string): number[] {
  if (isMatrix(data)) {
    throw new TypeError(`${fn}: expected a one-dimensional array`);
  }
  return data.map(toNumber).filter((value) => !Number.isNaN(value));
}

/**
 * Returns `true` for NaN values, element-wise for arrays.
 */
export function isnan(
  value: unknown
): boolean | boolean[] | boolean[][] {
  if (Array.isArray(value)) {
    if (isMatrix(value)) {
      return value.map((row) => row.map(isNaNValue));
    }
    return (value as readonly unknown[]).map(isNaNValue);
  }
  return isNaNValue(value);
}

/**
 * Returns `true` for missing values (`null`, `undefined`, or NaN),
 * element-wise for arrays. Unlike `isnan`, this also catches empty cells
 * returned by the data readers.
 */
export function isna(
  value: unknown
): boolean | boolean[] | boolean[][] {
  if (Array.isArray(value)) {
    if (isMatrix(value)) {
      return value.map((row) => row.map(isMissingValue));
    }
    return (value as readonly unknown[]).map(isMissingValue);
  }
  return isMissingValue(value);
}

/**
 * Removes missing values from a vector, or rows containing missing values
 * from a matrix. Non-numeric values are treated as missing.
 */
export function dropna(
  data: readonly unknown[]
): number[] | number[][] {
  if (isMatrix(data)) {
    return data
      .map((row) => row.map(toNumber))
      .filter((row) => row.every((value) => !Number.isNaN(value)));
  }
  return data.map(toNumber).filter((value) => !Number.isNaN(value));
}

/**
 * Replaces missing values with `value`, element-wise for vectors and
 * matrices. Non-numeric cells are also replaced.
 */
export function fillna(
  data: readonly unknown[],
  value: number
): number[] | number[][] {
  assertFinite(value, "value", "fillna");
  const replace = (cell: unknown) => {
    const number = toNumber(cell);
    return Number.isNaN(number) ? value : number;
  };

  if (isMatrix(data)) {
    return data.map((row) => row.map(replace));
  }
  return data.map(replace);
}

/**
 * Arithmetic mean ignoring missing values. Returns NaN when no valid values
 * remain.
 */
export function nanmean(data: readonly unknown[]): number {
  const values = validNumbers(data, "nanmean");
  if (values.length === 0) return NaN;
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

/**
 * Sum ignoring missing values. Returns 0 when no valid values remain.
 */
export function nansum(data: readonly unknown[]): number {
  const values = validNumbers(data, "nansum");
  let sum = 0;
  for (const value of values) sum += value;
  return sum;
}

/**
 * Minimum ignoring missing values. Throws when no valid values remain.
 */
export function nanmin(data: readonly unknown[]): number {
  const values = validNumbers(data, "nanmin");
  if (values.length === 0) {
    throw new RangeError("nanmin: data contains no valid values");
  }
  return Math.min(...values);
}

/**
 * Maximum ignoring missing values. Throws when no valid values remain.
 */
export function nanmax(data: readonly unknown[]): number {
  const values = validNumbers(data, "nanmax");
  if (values.length === 0) {
    throw new RangeError("nanmax: data contains no valid values");
  }
  return Math.max(...values);
}

/**
 * Median ignoring missing values. Returns NaN when no valid values remain.
 */
export function nanmedian(data: readonly unknown[]): number {
  const values = validNumbers(data, "nanmedian");
  return values.length === 0 ? NaN : median(values);
}

/**
 * Sample or population variance ignoring missing values. Returns NaN when
 * there are not enough valid values.
 */
export function nanvariance(
  data: readonly unknown[],
  sample = true
): number {
  const values = validNumbers(data, "nanvariance");
  const divisor = sample ? values.length - 1 : values.length;
  if (divisor <= 0) return NaN;

  let sum = 0;
  for (const value of values) sum += value;
  const average = sum / values.length;
  let squared = 0;
  for (const value of values) {
    const difference = value - average;
    squared += difference * difference;
  }
  return squared / divisor;
}

/**
 * Standard deviation ignoring missing values. Returns NaN when there are not
 * enough valid values.
 */
export function nanstdev(
  data: readonly unknown[],
  sample = true
): number {
  return Math.sqrt(nanvariance(data, sample));
}

/**
 * Quantile ignoring missing values. Returns NaN when no valid values remain.
 */
export function nanquantile(
  data: readonly unknown[],
  p: number,
  options: QuantileOptions = {}
): number {
  const values = validNumbers(data, "nanquantile");
  return values.length === 0 ? NaN : quantile(values, p, options);
}

/**
 * Counts non-missing, numeric values.
 */
export function nancount(data: readonly unknown[]): number {
  return validNumbers(data, "nancount").length;
}

export const nanvar = nanvariance;
export const nanstd = nanstdev;
