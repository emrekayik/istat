/**
 * Computes a compensated sum of floating point numbers using the Neumaier algorithm.
 * Significantly reduces numerical rounding errors compared to naive summation.
 *
 * @param {readonly number[]} data - An array of numbers to sum.
 * @returns {number} The accurate sum of all elements.
 *
 * @example
 * ```ts
 * // Summing numbers where standard floating point creates precision loss
 * const values: number[] = [1e16, 1, -1e16];
 *
 * // Standard loop might produce 0 due to catastrophic cancellation
 * const preciseSum = neumaierSum(values);
 * console.log(preciseSum); // => 1
 * ```
 */
export function neumaierSum(data: readonly number[]): number {
  let sum = 0;
  let c = 0;
  for (const x of data) {
    const t = sum + x;
    c += Math.abs(sum) >= Math.abs(x) ? sum - t + x : x - t + sum;
    sum = t;
  }
  return sum + c;
}
