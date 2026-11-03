import { mean } from "./mean";

export function variance(data: readonly number[], sample = true): number {
  const n = data.length;
  if (n === 0) throw new RangeError("variance: boş dizi");
  if (sample && n < 2) throw new RangeError("variance: n≥2 gerekli");

  const m = mean(data); // 1. geçiş
  let ss = 0;
  for (const x of data) {
    // 2. geçiş
    const d = x - m;
    ss += d * d;
  }
  return ss / (sample ? n - 1 : n);
}
