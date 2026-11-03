import { assertNonEmpty } from "../internal/validate";
import { quantile } from "./quantile";
import { stdev } from "./stdev";
import type { Data, Bin } from "../internal/types";

export type BinMethod = "sturges" | "freedman-diaconis" | "scott" | "sqrt";

export interface HistogramOptions {
  /**
   * Number of bins, or an automatic bin selection method.
   * Defaults to `"sturges"`.
   */
  bins?: number | BinMethod;
  /**
   * Explicit minimum data bound for binning. Defaults to the minimum value in data.
   */
  min?: number;
  /**
   * Explicit maximum data bound for binning. Defaults to the maximum value in data.
   */
  max?: number;
}

/**
 * Computes histogram bins for a given dataset.
 *
 * @param {Data} data - A non-empty readonly array of numbers (`number[]`).
 * @param {HistogramOptions} [options={}] - Options controlling bin count or algorithm (`"sturges"`, `"freedman-diaconis"`, `"scott"`, `"sqrt"`).
 * @returns {Bin[]} An array of bin objects containing `{ x0, x1, count }`.
 *
 * @example
 * ```ts
 * const data: number[] = [1, 2, 2, 3, 3, 3, 4, 4, 5];
 *
 * // Automatically partitions data into bins
 * const bins = histogram(data, { bins: 5 });
 * console.log(bins);
 * // Output:
 * // [
 * //   { x0: 1, x1: 1.8, count: 1 },
 * //   { x0: 1.8, x1: 2.6, count: 2 },
 * //   { x0: 2.6, x1: 3.4, count: 3 },
 * //   { x0: 3.4, x1: 4.2, count: 2 },
 * //   { x0: 4.2, x1: 5,   count: 1 }
 * // ]
 * ```
 */
export function histogram(data: Data, options: HistogramOptions = {}): Bin[] {
  assertNonEmpty(data, "histogram");

  let minVal = data[0]!;
  let maxVal = data[0]!;
  for (const x of data) {
    if (x < minVal) minVal = x;
    if (x > maxVal) maxVal = x;
  }

  const min = options.min ?? minVal;
  const max = options.max ?? maxVal;

  if (min >= max) {
    return [{ x0: min, x1: min + 1, count: data.length }];
  }

  const n = data.length;
  let numBins: number;

  const binOpt = options.bins ?? "sturges";
  if (typeof binOpt === "number") {
    numBins = Math.max(1, Math.round(binOpt));
  } else {
    switch (binOpt) {
      case "sqrt":
        numBins = Math.max(1, Math.ceil(Math.sqrt(n)));
        break;
      case "freedman-diaconis": {
        const q75 = quantile(data, 0.75);
        const q25 = quantile(data, 0.25);
        const iqr = q75 - q25;
        const binWidth = 2 * iqr * Math.pow(n, -1 / 3);
        numBins = binWidth > 0 ? Math.max(1, Math.ceil((max - min) / binWidth)) : Math.max(1, Math.ceil(Math.log2(n) + 1));
        break;
      }
      case "scott": {
        const s = stdev(data);
        const binWidth = 3.49 * s * Math.pow(n, -1 / 3);
        numBins = binWidth > 0 ? Math.max(1, Math.ceil((max - min) / binWidth)) : Math.max(1, Math.ceil(Math.log2(n) + 1));
        break;
      }
      case "sturges":
      default:
        numBins = Math.max(1, Math.ceil(Math.log2(n) + 1));
        break;
    }
  }

  const step = (max - min) / numBins;
  const bins: Bin[] = [];
  const counts = new Array<number>(numBins).fill(0);

  for (const x of data) {
    if (x < min || x > max) continue;
    let idx = Math.floor((x - min) / step);
    if (idx >= numBins) idx = numBins - 1; // max value goes into the last bin
    counts[idx] = (counts[idx] ?? 0) + 1;
  }

  for (let i = 0; i < numBins; i++) {
    bins.push({
      x0: min + i * step,
      x1: i === numBins - 1 ? max : min + (i + 1) * step,
      count: counts[i] ?? 0,
    });
  }

  return bins;
}

