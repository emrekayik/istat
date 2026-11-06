import { describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as XLSX from "xlsx";
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
  lineToSvg,
  barToSvg,
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
  readData,
  readCsv,
  readXlsx,
  readJson,
  writeData,
  writeCsv,
  writeXlsx,
  writeJson,
  column,
  isnan,
  isna,
  dropna,
  fillna,
  nancount,
  nanmean,
  nansum,
  nanmin,
  nanmax,
  nanmedian,
  nanvariance,
  nanstdev,
  nanquantile,
  benchmark,
  now,
  tic,
  toc,
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

describe("istat - Data Import", () => {
  it("reads CSV records and extracts columns", () => {
    const dir = mkdtempSync(join(tmpdir(), "istat-data-"));
    try {
      const path = join(dir, "measurements.csv");
      writeFileSync(path, 'name,value,note\nalpha,2,"first, sample"\nbeta,4,"say ""hi"""\n');

      const rows = readCsv(path) as Record<string, unknown>[];
      expect(rows).toEqual([
        { name: "alpha", value: 2, note: "first, sample" },
        { name: "beta", value: 4, note: 'say "hi"' },
      ]);
      expect(column(rows, "value")).toEqual([2, 4]);
      expect(readCsv(path, false)).toEqual([
        ["name", "value", "note"],
        ["alpha", 2, "first, sample"],
        ["beta", 4, 'say "hi"'],
      ]);
      expect(readData(path)).toEqual(rows);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reads JSON and XLSX files, including worksheet selection", () => {
    const dir = mkdtempSync(join(tmpdir(), "istat-data-"));
    try {
      const jsonPath = join(dir, "records.json");
      const xlsxPath = join(dir, "records.xlsx");
      writeFileSync(jsonPath, JSON.stringify([{ name: "Ada", score: 9 }]));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([["name", "score"], ["Ada", 9]]),
        "Scores"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([["name", "score"], ["Lin", 10]]),
        "Other"
      );
      XLSX.writeFile(workbook, xlsxPath);

      expect(readJson(jsonPath)).toEqual([{ name: "Ada", score: 9 }]);
      expect(readData(jsonPath)).toEqual([{ name: "Ada", score: 9 }]);
      expect(readXlsx(xlsxPath, "Other")).toEqual([{ name: "Lin", score: 10 }]);
      expect(column(readXlsx(xlsxPath), "score")).toEqual([9]);
      expect(readXlsx(xlsxPath, 0, false)).toEqual([
        ["name", "score"],
        ["Ada", 9],
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects unsupported extensions and missing columns", () => {
    expect(() => readData("unknown.parquet")).toThrow("unsupported file type");
    expect(() => column([{ value: 1 }], "missing")).toThrow("column 'missing' not found");
  });
});

describe("istat - Data Export", () => {
  it("writes CSV, JSON, and XLSX files chosen by extension", () => {
    const dir = mkdtempSync(join(tmpdir(), "istat-export-"));
    try {
      const rows = [
        { name: "Ada", score: 9 },
        { name: "Lin", score: 10 },
      ];
      const csvPath = join(dir, "scores.csv");
      const jsonPath = join(dir, "scores.json");
      const xlsxPath = join(dir, "scores.xlsx");

      expect(writeData(csvPath, rows)).toBe(`Saved CSV to ${csvPath}`);
      expect(readFileSync(csvPath, "utf8")).toBe("name,score\nAda,9\nLin,10\n");
      expect(readCsv(csvPath)).toEqual(rows);

      expect(writeData(jsonPath, rows)).toBe(`Saved JSON to ${jsonPath}`);
      expect(readJson(jsonPath)).toEqual(rows);

      expect(writeData(xlsxPath, rows)).toBe(`Saved XLSX to ${xlsxPath}`);
      expect(readXlsx(xlsxPath)).toEqual(rows);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("writes rows, records, single records, and quoted CSV cells", () => {
    const dir = mkdtempSync(join(tmpdir(), "istat-export-"));
    try {
      const matrixPath = join(dir, "matrix.csv");
      expect(writeCsv(matrixPath, [[1, 2], [3, 4]], false)).toContain("Saved CSV");
      expect(readFileSync(matrixPath, "utf8")).toBe("1,2\n3,4\n");

      const recordPath = join(dir, "record.csv");
      writeCsv(recordPath, { name: "Ada", note: 'say "hi"', score: null });
      expect(readFileSync(recordPath, "utf8")).toBe(
        'name,note,score\nAda,"say ""hi""",\n'
      );

      const valuePath = join(dir, "values.csv");
      writeCsv(valuePath, [1, 2, 3]);
      expect(readFileSync(valuePath, "utf8")).toBe("value\n1\n2\n3\n");

      const jsonPath = join(dir, "record.json");
      writeJson(jsonPath, { name: "Ada" });
      expect(readFileSync(jsonPath, "utf8")).toBe(
        '{\n  "name": "Ada"\n}\n'
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects unsupported write extensions and invalid data", () => {
    expect(() => writeData("unknown.parquet", [1, 2])).toThrow(
      "unsupported file type"
    );
    expect(() => writeJson("record.json", undefined)).toThrow(
      "data cannot be undefined"
    );
    expect(() => writeCsv("mixed.csv", [[1, 2], { value: 3 }])).toThrow(
      "rows of the same shape"
    );
    expect(() => writeXlsx("record.xlsx", "not tabular")).toThrow(
      "data must be an array or record"
    );
  });
});

describe("istat - Missing Data", () => {
  it("detects NaN and missing values element-wise", () => {
    expect(isnan(Number.NaN)).toBe(true);
    expect(isnan(null)).toBe(false);
    expect(isnan([1, Number.NaN, null, undefined])).toEqual([
      false,
      true,
      false,
      false,
    ]);
    expect(isnan([[1, Number.NaN], [null, 2]])).toEqual([
      [false, true],
      [false, false],
    ]);

    expect(isna(null)).toBe(true);
    expect(isna(undefined)).toBe(true);
    expect(isna(Number.NaN)).toBe(true);
    expect(isna("text")).toBe(false);
    expect(isna([1, Number.NaN, null, undefined])).toEqual([
      false,
      true,
      true,
      true,
    ]);
    expect(isna([[1, Number.NaN], [null, 2]])).toEqual([
      [false, true],
      [true, false],
    ]);
  });

  it("drops and fills missing values in vectors and matrices", () => {
    expect(dropna([1, null, 3, Number.NaN, undefined])).toEqual([1, 3]);
    expect(dropna([[1, 2], [null, 3], [4, Number.NaN]])).toEqual([[1, 2]]);
    expect(fillna([1, null, Number.NaN, 4], 0)).toEqual([1, 0, 0, 4]);
    expect(fillna([[1, null], [Number.NaN, 3]], -1)).toEqual([
      [1, -1],
      [-1, 3],
    ]);
  });

  it("computes statistics that ignore missing values", () => {
    const data = [1, Number.NaN, 3, null, 5];
    expect(nancount(data)).toBe(3);
    expect(nanmean(data)).toBe(3);
    expect(nansum(data)).toBe(9);
    expect(nanmin(data)).toBe(1);
    expect(nanmax(data)).toBe(5);
    expect(nanmedian(data)).toBe(3);
    expect(nanvariance(data)).toBe(4);
    expect(nanstdev(data)).toBe(2);
    expect(nanquantile(data, 0.5)).toBe(3);
  });

  it("returns documented sentinels when no valid values remain", () => {
    expect(nanmean([null, Number.NaN])).toBeNaN();
    expect(nanmedian([null, Number.NaN])).toBeNaN();
    expect(nanvariance([null, Number.NaN])).toBeNaN();
    expect(nanstdev([null, Number.NaN])).toBeNaN();
    expect(nanquantile([null, Number.NaN], 0.5)).toBeNaN();
    expect(nansum([null, Number.NaN])).toBe(0);
    expect(() => nanmin([null, Number.NaN])).toThrow("no valid values");
    expect(() => nanmax([null, Number.NaN])).toThrow("no valid values");
  });
});

describe("istat - Timing and Benchmarking", () => {
  it("measures elapsed time and summarizes benchmark samples", () => {
    const start = tic();
    expect(toc(start)).toBeGreaterThanOrEqual(0);
    expect(now()).toBeGreaterThanOrEqual(start);

    let calls = 0;
    const result = benchmark(() => {
      calls++;
    }, 3, 2);

    expect(calls).toBe(5);
    expect(result.iterations).toBe(3);
    expect(result.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.meanMs).toBeGreaterThanOrEqual(0);
    expect(result.medianMs).toBeGreaterThanOrEqual(0);
    expect(result.minMs).toBeLessThanOrEqual(result.maxMs);
    expect(result.opsPerSecond).toBeGreaterThan(0);
  });

  it("validates benchmark arguments and timestamps", () => {
    expect(() => benchmark("not a function" as never)).toThrow(
      "callback must be a function"
    );
    expect(() => benchmark(() => {}, 0)).toThrow(
      "iterations must be a positive integer"
    );
    expect(() => benchmark(() => {}, 1, -1)).toThrow(
      "warmup must be a non-negative integer"
    );
    expect(() => toc(Number.NaN)).toThrow("start time must be a finite number");
    expect(() => toc(now() + 1000)).toThrow("start time cannot be in the future");
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
