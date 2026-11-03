import { assertNonEmpty } from "../internal/validate.js";

export function mean(data: readonly number[]): number {
  assertNonEmpty(data, "mean");
  let s = 0;
  for (let i = 0; i < data.length; i++) s += data[i];
  return s / data.length;
}