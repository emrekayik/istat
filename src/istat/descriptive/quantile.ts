import { assertNonEmpty } from "../internal/validate.js";

export type QuantileMethod =
  | "linear" // R type 7, numpy default
  | "lower"
  | "higher"
  | "nearest"
  | "midpoint";

export interface QuantileOptions {
  method?: QuantileMethod; // default: "linear"
}

/**
 * p ∈ [0, 1]. Boş dizi veya geçersiz p → RangeError.
 * O(n) — girdiyi kopyalar, mutasyona uğratmaz.
 */
export function quantile(
  data: readonly number[],
  p: number,
  options: QuantileOptions = {},
): number {
  assertNonEmpty(data, "quantile");
  if (p < 0 || p > 1) {
    throw new RangeError(`quantile: p ∈ [0,1] olmalı, ${p} verildi`);
  }
  const { method = "linear" } = options;
  const sorted = [...data].sort((a, b) => a - b);
  // ... implementasyon
  return 0;
}
