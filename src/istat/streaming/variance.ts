/**
 * Online/streaming variance and standard deviation accumulator using Welford's algorithm.
 * Numerically stable and computes variance in a single pass.
 *
 * @example
 * ```ts
 * const acc = new VarianceAccumulator(true); // sample variance (n - 1)
 * [2, 4, 4, 4, 5, 5, 7, 9].forEach((x) => acc.add(x));
 *
 * console.log(acc.count);    // => 8
 * console.log(acc.mean);     // => 5
 * console.log(acc.variance); // => ~4.5714
 * console.log(acc.stdev);    // => ~2.138
 * ```
 */
export class VarianceAccumulator {
  private n = 0;
  private currentMean = 0;
  private m2 = 0;

  /**
   * @param {boolean} [sample=true] - If `true`, computes sample variance (n - 1); if `false`, computes population variance (n).
   */
  constructor(private readonly sample = true) {}

  /**
   * Adds a new value to the running variance calculation.
   * @param {number} x - The incoming number.
   * @returns {this} The accumulator instance (chainable).
   */
  add(x: number): this {
    this.n++;
    const d = x - this.currentMean;
    this.currentMean += d / this.n;
    this.m2 += d * (x - this.currentMean);
    return this;
  }

  /**
   * Total number of elements received so far.
   */
  get count(): number {
    return this.n;
  }

  /**
   * The current running mean.
   */
  get mean(): number {
    return this.n === 0 ? NaN : this.currentMean;
  }

  /**
   * The current running variance.
   */
  get variance(): number {
    if (this.sample && this.n < 2) return NaN;
    if (!this.sample && this.n < 1) return NaN;
    return this.m2 / (this.sample ? this.n - 1 : this.n);
  }

  /**
   * The current running standard deviation.
   */
  get stdev(): number {
    return Math.sqrt(this.variance);
  }
}

/**
 * Computes the variance in a single pass over an iterable dataset without storing the entire sequence in memory.
 *
 * @param {Iterable<number>} iter - An iterable sequence of numbers (e.g., Array, Generator, Set).
 * @param {boolean} [sample=true] - If `true`, computes sample variance (n - 1); if `false`, computes population variance (n).
 * @returns {number} The calculated variance.
 *
 * @example
 * ```ts
 * const numbers = [2, 4, 4, 4, 5, 5, 7, 9];
 *
 * const sampleVar = varianceStream(numbers);       // => ~4.5714
 * const popVar    = varianceStream(numbers, false);// => 4.0
 * ```
 */
export function varianceStream(iter: Iterable<number>, sample = true): number {
  const acc = new VarianceAccumulator(sample);
  for (const x of iter) acc.add(x);
  return acc.variance;
}
