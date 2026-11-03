/**
 * Online/streaming arithmetic mean accumulator using a stable running formula.
 *
 * @example
 * ```ts
 * const acc = new MeanAccumulator();
 * acc.add(10).add(20).add(30);
 *
 * console.log(acc.count); // => 3
 * console.log(acc.mean);  // => 20
 * ```
 */
export class MeanAccumulator {
  private n = 0;
  private currentMean = 0;

  /**
   * Adds a new value to the running mean calculation.
   * @param {number} x - The incoming number.
   * @returns {this} The accumulator instance (chainable).
   */
  add(x: number): this {
    this.n++;
    this.currentMean += (x - this.currentMean) / this.n;
    return this;
  }

  /**
   * Total number of elements received so far.
   */
  get count(): number {
    return this.n;
  }

  /**
   * The current running mean, or `NaN` if no elements were added.
   */
  get mean(): number {
    return this.n === 0 ? NaN : this.currentMean;
  }
}

/**
 * Computes the mean in a single pass over an iterable dataset without loading everything into memory.
 *
 * @param {Iterable<number>} iter - An iterable sequence of numbers (e.g., Array, Generator, Set).
 * @returns {number} The arithmetic mean of the sequence.
 *
 * @example
 * ```ts
 * function* numberGenerator() {
 *   yield 10;
 *   yield 20;
 *   yield 30;
 * }
 *
 * const result = meanStream(numberGenerator());
 * console.log(result); // => 20
 * ```
 */
export function meanStream(iter: Iterable<number>): number {
  const acc = new MeanAccumulator();
  for (const x of iter) acc.add(x);
  return acc.mean;
}
