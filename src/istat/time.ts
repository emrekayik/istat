export interface BenchmarkResult {
  readonly iterations: number;
  readonly totalMs: number;
  readonly meanMs: number;
  readonly medianMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly opsPerSecond: number;
}

/** Returns the monotonic high-resolution clock in milliseconds. */
export function now(): number {
  return performance.now();
}

/** Captures a start time for use with `toc`. */
export function tic(): number {
  return now();
}

/** Returns elapsed time in seconds since a timestamp returned by `tic` or `now`. */
export function toc(startTime: number): number {
  if (!Number.isFinite(startTime)) {
    throw new TypeError("toc: start time must be a finite number");
  }
  const elapsedMs = now() - startTime;
  if (elapsedMs < 0) {
    throw new RangeError("toc: start time cannot be in the future");
  }
  return elapsedMs / 1000;
}

/** Runs a synchronous function repeatedly and summarizes its execution time. */
export function benchmark(
  callback: () => unknown,
  iterations = 100,
  warmup = 1
): BenchmarkResult {
  if (typeof callback !== "function") {
    throw new TypeError("benchmark: callback must be a function");
  }
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new RangeError("benchmark: iterations must be a positive integer");
  }
  if (!Number.isInteger(warmup) || warmup < 0) {
    throw new RangeError("benchmark: warmup must be a non-negative integer");
  }

  for (let i = 0; i < warmup; i++) callback();

  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = now();
    callback();
    samples.push(now() - start);
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const totalMs = samples.reduce((sum, sample) => sum + sample, 0);
  const middle = Math.floor(sorted.length / 2);
  const medianMs =
    sorted.length % 2 === 0
      ? (sorted[middle - 1]! + sorted[middle]!) / 2
      : sorted[middle]!;

  return {
    iterations,
    totalMs,
    meanMs: totalMs / iterations,
    medianMs,
    minMs: sorted[0]!,
    maxMs: sorted[sorted.length - 1]!,
    opsPerSecond: totalMs === 0 ? Infinity : (iterations * 1000) / totalMs,
  };
}
