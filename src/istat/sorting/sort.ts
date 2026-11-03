import type { Data } from "../internal/types";

/**
 * Returns a new sorted copy of the given numeric array (does not mutate the original array).
 */
export function numericSort(data: Data, ascending = true): number[] {
  const copy = [...data];
  return ascending ? copy.sort((a, b) => a - b) : copy.sort((a, b) => b - a);
}
