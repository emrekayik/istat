import { describe, expect, it } from "bun:test";
import {
  mean,
  median,
  variance,
  stdev,
  quantile,
  summary,
  histogram,
  covariance,
  pearson,
  spearman,
  linearRegression,
  polynomialRegression,
  MeanAccumulator,
  VarianceAccumulator,
  numericSort,
  quickselect,
  histogramToSvg,
  scatterToSvg,
  mode,
  skewness,
  kurtosis,
  zscore,
  covarianceMatrix,
  transpose,
  matmul,
  dot,
  identity,
  diagonal,
  trace,
  determinant,
  inverse,
  solve,
  normalPdf,
  normalCdf,
  binomialPmf,
  binomialCdf,
  poissonPmf,
  poissonCdf,
  uniformPdf,
  uniformCdf,
} from "../src/istat";

describe("istat - Descriptive Statistics", () => {
  it("calculates mean", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([10])).toBe(10);
    expect(() => mean([])).toThrow();
  });

  it("calculates median", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([42])).toBe(42);
    expect(() => median([])).toThrow();
  });

  it("calculates variance and stdev", () => {
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    // Sample variance = 4.5714..., Population variance = 4
    expect(variance(data, false)).toBe(4);
    expect(variance(data, true)).toBeCloseTo(4.5714, 3);
    expect(stdev(data, false)).toBe(2);
    expect(stdev(data, true)).toBeCloseTo(2.138, 3);
  });

  it("calculates quantiles", () => {
    const data = [3, 6, 7, 8, 8, 10, 13, 15, 16, 20];
    expect(quantile(data, 0.5)).toBe(9); // median
    expect(quantile(data, 0)).toBe(3);   // min
    expect(quantile(data, 1)).toBe(20);  // max
  });

  it("calculates summary", () => {
    const s = summary([1, 2, 3, 4, 5]);
    expect(s.count).toBe(5);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
    expect(s.sum).toBe(15);
    expect(s.mean).toBe(3);
    expect(s.median).toBe(3);
  });

  it("calculates histogram bins", () => {
    const data = [1, 2, 2, 3, 3, 3, 4, 4, 5];
    const bins = histogram(data, { bins: 4 });
    expect(bins.length).toBe(4);
    const totalCount = bins.reduce((acc, b) => acc + b.count, 0);
    expect(totalCount).toBe(data.length);
  });

  it("calculates mode, moments, z-scores, and covariance matrices", () => {
    expect(mode([1, 2, 2, 3, 3])).toEqual([2, 3]);
    expect(skewness([-2, -1, 0, 1, 2])).toBeCloseTo(0, 12);
    expect(kurtosis([-2, -1, 0, 1, 2])).toBeCloseTo(-1.3, 12);
    expect(zscore([1, 2, 3])).toEqual([-Math.sqrt(1.5), 0, Math.sqrt(1.5)]);
    expect(covarianceMatrix([[1, 2], [2, 4], [3, 6]])).toEqual([
      [1, 2],
      [2, 4],
    ]);
  });
});

describe("istat - Matrix and Linear Algebra", () => {
  it("supports transpose, vector and matrix multiplication", () => {
    expect(transpose([[1, 2], [3, 4]])).toEqual([[1, 3], [2, 4]]);
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
    expect(matmul([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([
      [19, 22],
      [43, 50],
    ]);
    expect(matmul([[1, 2], [3, 4]], [5, 6])).toEqual([17, 39]);
  });

  it("supports identity, diagonal, trace, determinant, inverse, and solve", () => {
    expect(identity(2)).toEqual([[1, 0], [0, 1]]);
    expect(diagonal([2, 3])).toEqual([[2, 0], [0, 3]]);
    expect(diagonal([[2, 1], [1, 3]])).toEqual([2, 3]);
    expect(trace([[2, 1], [1, 3]])).toBe(5);
    expect(determinant([[4, 7], [2, 6]])).toBeCloseTo(10);
    const inverted = inverse([[4, 7], [2, 6]]);
    expect(inverted[0]![0]).toBeCloseTo(0.6);
    expect(inverted[0]![1]).toBeCloseTo(-0.7);
    expect(inverted[1]![0]).toBeCloseTo(-0.2);
    expect(inverted[1]![1]).toBeCloseTo(0.4);
    expect(solve([[3, 1], [1, 2]], [9, 8])).toEqual([2, 3]);
  });

  it("rejects incompatible and singular matrix operations", () => {
    expect(() => matmul([[1, 2]], [[1, 2]])).toThrow("incompatible dimensions");
    expect(() => inverse([[1, 2], [2, 4]])).toThrow("matrix is singular");
  });
});

describe("istat - Probability Distributions", () => {
  it("calculates normal and uniform densities and cumulative probabilities", () => {
    expect(normalPdf(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 12);
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1.95996398454)).toBeCloseTo(0.975, 6);
    expect(uniformPdf(0.5)).toBe(1);
    expect(uniformPdf(2)).toBe(0);
    expect(uniformCdf(0.25, 0, 2)).toBeCloseTo(0.125);
  });

  it("calculates binomial and Poisson probabilities", () => {
    expect(binomialPmf(2, 5, 0.5)).toBeCloseTo(0.3125);
    expect(binomialCdf(2, 5, 0.5)).toBeCloseTo(0.5);
    expect(poissonPmf(2, 3)).toBeCloseTo(0.2240418077, 9);
    expect(poissonCdf(2, 3)).toBeCloseTo(0.4231900811, 9);
  });
});

describe("istat - Correlation & Regression", () => {
  it("calculates covariance and pearson correlation", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(pearson(x, y)).toBeCloseTo(1, 6);

    const negY = [10, 8, 6, 4, 2];
    expect(pearson(x, negY)).toBeCloseTo(-1, 6);
  });

  it("calculates spearman rank correlation", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 6, 11, 12, 19];
    expect(spearman(x, y)).toBeCloseTo(1, 6);
  });

  it("fits linear regression", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [3, 5, 7, 9, 11]; // y = 2x + 1
    const model = linearRegression(x, y);
    expect(model.slope).toBeCloseTo(2, 6);
    expect(model.intercept).toBeCloseTo(1, 6);
    expect(model.r2).toBeCloseTo(1, 6);
    expect(model.predict(6)).toBeCloseTo(13, 6);
  });

  it("fits polynomial regression", () => {
    const x = [-2, -1, 0, 1, 2];
    const y = [4, 1, 0, 1, 4]; // y = x^2
    const model = polynomialRegression(x, y, 2);
    expect(model.predict(3)).toBeCloseTo(9, 4);
    expect(model.r2).toBeCloseTo(1, 4);
  });
});

describe("istat - Streaming / Online Accumulators", () => {
  it("accumulates mean in stream", () => {
    const acc = new MeanAccumulator();
    [10, 20, 30].forEach((v) => acc.add(v));
    expect(acc.count).toBe(3);
    expect(acc.mean).toBe(20);
  });

  it("accumulates variance in stream", () => {
    const acc = new VarianceAccumulator(false);
    [2, 4, 4, 4, 5, 5, 7, 9].forEach((v) => acc.add(v));
    expect(acc.variance).toBe(4);
    expect(acc.stdev).toBe(2);
  });
});

describe("istat - Sorting & Quickselect", () => {
  it("numericSort creates sorted copy", () => {
    const orig = [5, 2, 8, 1];
    const sorted = numericSort(orig);
    expect(sorted).toEqual([1, 2, 5, 8]);
    expect(orig).toEqual([5, 2, 8, 1]); // immutability
  });

  it("quickselect finds k-th smallest element", () => {
    const arr = [9, 3, 7, 1, 5, 4, 8, 2, 6];
    expect(quickselect(arr, 0)).toBe(1);
    expect(quickselect(arr, 4)).toBe(5);
    expect(quickselect(arr, 8)).toBe(9);
  });
});

describe("render - SVG Visualizations", () => {
  it("renders histogram to valid SVG string", () => {
    const data = [1, 2, 2, 3, 3, 3, 4, 4, 5];
    const bins = histogram(data, { bins: 4 });
    const svg = histogramToSvg(bins, {
      title: "Test Histogram",
      xLabel: "Value",
      yLabel: "Frequency",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("Test Histogram");
    expect(svg).toContain("<rect");
  });

  it("renders scatter plot to valid SVG string", () => {
    const points: [number, number][] = [
      [1, 2],
      [2, 4],
      [3, 6],
    ];
    const svg = scatterToSvg(points, {
      title: "Test Scatter",
      xLabel: "X",
      yLabel: "Y",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("Test Scatter");
    expect(svg).toContain("<circle");
  });
});
