/**
 * Online/streaming variance and standard deviation accumulator (Welford's algorithm).
 */
export class VarianceAccumulator {
  private n = 0;
  private currentMean = 0;
  private m2 = 0;

  constructor(private readonly sample = true) {}

  add(x: number): this {
    this.n++;
    const d = x - this.currentMean;
    this.currentMean += d / this.n;
    this.m2 += d * (x - this.currentMean);
    return this;
  }

  get count(): number {
    return this.n;
  }

  get mean(): number {
    return this.n === 0 ? NaN : this.currentMean;
  }

  get variance(): number {
    if (this.sample && this.n < 2) return NaN;
    if (!this.sample && this.n < 1) return NaN;
    return this.m2 / (this.sample ? this.n - 1 : this.n);
  }

  get stdev(): number {
    return Math.sqrt(this.variance);
  }
}

/**
 * Computes the variance in a single pass over an iterable dataset.
 */
export function varianceStream(iter: Iterable<number>, sample = true): number {
  const acc = new VarianceAccumulator(sample);
  for (const x of iter) acc.add(x);
  return acc.variance;
}
