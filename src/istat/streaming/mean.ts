/**
 * Online/streaming arithmetic mean accumulator (stable Welford-like formula).
 */
export class MeanAccumulator {
  private n = 0;
  private currentMean = 0;

  add(x: number): this {
    this.n++;
    this.currentMean += (x - this.currentMean) / this.n;
    return this;
  }

  get count(): number {
    return this.n;
  }

  get mean(): number {
    return this.n === 0 ? NaN : this.currentMean;
  }
}

/**
 * Computes the mean in a single pass over an iterable dataset.
 */
export function meanStream(iter: Iterable<number>): number {
  const acc = new MeanAccumulator();
  for (const x of iter) acc.add(x);
  return acc.mean;
}
