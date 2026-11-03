// streaming/variance.ts
export class VarianceAccumulator {
  private n = 0;
  private mean = 0;
  private m2 = 0;

  constructor(private readonly sample = true) {}

  add(x: number): this {
    this.n++;
    const d = x - this.mean;
    this.mean += d / this.n;
    this.m2 += d * (x - this.mean);
    return this;
  }

  get count(): number {
    return this.n;
  }

  get variance(): number {
    if (this.sample && this.n < 2) return NaN;
    return this.m2 / (this.sample ? this.n - 1 : this.n);
  }
}

export function varianceStream(iter: Iterable<number>, sample = true): number {
  const acc = new VarianceAccumulator(sample);
  for (const x of iter) acc.add(x);
  return acc.variance;
}
