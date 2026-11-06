import { describe, expect, it } from "bun:test";
import type {
  BarChartInfo,
  HistogramChartInfo,
  LineChartInfo,
  ScatterChartInfo,
} from "../src/core/charts";
import { createEnvironment, evaluate } from "../src/core/parser";
import { barToSvg, lineToSvg } from "../src/istat/render/svg";
import {
  chartToText,
  chartTitle,
  renderBarRows,
  renderChartRows,
  renderHistogramRows,
  renderLineRows,
  renderScatterRows,
} from "../src/commands/chart";

describe("chart metadata", () => {
  it("registers histogram charts produced by plotHist", () => {
    const env = createEnvironment();
    evaluate(
      'data = [1, 2, 2, 3, 3, 3, 4, 5]; svg = plotHist(data, 4, "Hist Title");',
      env
    );

    const svg = env.get("svg");
    const charts = env.getCharts();
    expect(charts).toHaveLength(1);

    const chart = charts[0]!;
    expect(chart.kind).toBe("histogram");
    expect(chart.title).toBe("Hist Title");
    expect(chart.svg).toBe(svg);
    expect(env.getChart(svg)).toBe(chart);
    expect(env.getChart("not-a-chart")).toBeUndefined();
    expect(env.getChart(undefined)).toBeUndefined();

    if (chart.kind === "histogram") {
      expect(chart.bins).toHaveLength(4);
      expect(chart.bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(8);
    }
  });

  it("registers scatter charts produced by scatter", () => {
    const env = createEnvironment();
    evaluate('svg = scatter([1, 2, 3], [4, 5, 6], "Points");', env);

    const chart = env.getCharts()[0]!;
    expect(chart.kind).toBe("scatter");
    expect(chart.title).toBe("Points");
    expect(chart.svg).toBe(env.get("svg"));

    if (chart.kind === "scatter") {
      expect(chart.points).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    }
  });

  it("registers line charts produced by plotLine", () => {
    const env = createEnvironment();
    evaluate('svg = plotLine([1, 2, 3], [4, 5, 6], "Trend");', env);

    const chart = env.getCharts()[0]!;
    expect(chart.kind).toBe("line");
    expect(chart.title).toBe("Trend");
    expect(chart.svg).toBe(env.get("svg"));
    expect(chart.svg).toContain("<polyline");

    if (chart.kind === "line") {
      expect(chart.points).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    }
  });

  it("uses one-based indices when plotLine receives only y values", () => {
    const env = createEnvironment();
    evaluate("svg = plotLine([3, 1, 4]);", env);

    const chart = env.getCharts()[0]!;
    expect(chart.kind).toBe("line");
    if (chart.kind === "line") {
      expect(chart.points).toEqual([
        [1, 3],
        [2, 1],
        [3, 4],
      ]);
    }
  });

  it("registers bar charts produced by bar and plotBar", () => {
    const env = createEnvironment();
    evaluate('svg = bar(["A", "B", "C"], [4, 7, 2], "Counts");', env);

    const chart = env.getCharts()[0]!;
    expect(chart.kind).toBe("bar");
    expect(chart.title).toBe("Counts");
    expect(chart.svg).toBe(env.get("svg"));
    expect(chart.svg).toContain("<rect");

    if (chart.kind === "bar") {
      expect(chart.labels).toEqual(["A", "B", "C"]);
      expect(chart.values).toEqual([4, 7, 2]);
    }

    evaluate('plotBar([1, 2], [3, 4]);', env);
    const second = env.getCharts()[1]!;
    expect(second.kind).toBe("bar");
    if (second.kind === "bar") {
      expect(second.labels).toEqual(["1", "2"]);
      expect(second.values).toEqual([3, 4]);
    }
  });

  it("derives bar labels from values and accepts an optional title", () => {
    const env = createEnvironment();
    evaluate('svg = bar([4, 7, 2], "Counts");', env);

    const chart = env.getCharts()[0]!;
    expect(chart.kind).toBe("bar");
    expect(chart.title).toBe("Counts");
    if (chart.kind === "bar") {
      expect(chart.labels).toEqual(["1", "2", "3"]);
      expect(chart.values).toEqual([4, 7, 2]);
    }
  });

  it("finds charts even when the trailing semicolon suppresses output", () => {
    const env = createEnvironment();
    const result = evaluate(
      'plotHist([1, 2, 3, 3, 4], 3, "Quiet");',
      env
    );

    expect(result.outputs).toHaveLength(0);
    expect(env.getChart(result.lastValue)).toBeDefined();
  });

  it("shares the chart registry with child environments", () => {
    const env = createEnvironment();
    const child = env.createChild();
    evaluate('plotHist([1, 2, 2, 3], 2, "Child");', child);

    expect(env.getCharts()).toHaveLength(1);
    expect(child.getCharts()).toHaveLength(1);
    expect(child.getChart(child.getCharts()[0]!.svg)).toBeDefined();
  });
});

describe("terminal chart rendering", () => {
  const histogram: HistogramChartInfo = {
    kind: "histogram",
    title: "Counts",
    bins: [
      { x0: 1, x1: 3, count: 3 },
      { x0: 3, x1: 5, count: 2 },
      { x0: 5, x1: 7, count: 2 },
      { x0: 7, x1: 9, count: 2 },
    ],
    svg: "<svg />",
  };

  const scatter: ScatterChartInfo = {
    kind: "scatter",
    title: "Points",
    points: [
      [1, 1],
      [2, 2],
      [3, 3],
    ],
    svg: "<svg />",
  };

  const line: LineChartInfo = {
    kind: "line",
    title: "Trend",
    points: [
      [1, 1],
      [2, 2],
      [3, 3],
    ],
    svg: "<svg />",
  };

  const bar: BarChartInfo = {
    kind: "bar",
    title: "Counts",
    labels: ["A", "B", "C"],
    values: [4, 7, 2],
    svg: "<svg />",
  };

  it("renders a histogram with separated bars and labels", () => {
    const rows = renderHistogramRows(histogram, 30, 6);
    expect(rows).toHaveLength(6);

    const text = chartToText(rows);
    expect(text).toContain("Counts");
    expect(text).toContain("└");
    expect(text).toContain("1");
    expect(text).toContain("9");

    const topPlotRow = rows[1]!.map((segment) => segment.text).join("");
    expect(countCharacter(topPlotRow, "█")).toBe(5);

    const middlePlotRow = rows[2]!.map((segment) => segment.text).join("");
    expect(countCharacter(middlePlotRow, "█")).toBe(23);
  });

  it("renders a scatter plot with one marker per point", () => {
    const rows = renderScatterRows(scatter, 30, 6);
    expect(rows).toHaveLength(6);

    const text = chartToText(rows);
    expect(text).toContain("Points");
    expect(text).toContain("●");
    expect(countCharacter(text, "●")).toBe(3);
  });

  it("renders a line chart with connected markers", () => {
    const rows = renderLineRows(line, 30, 6);
    expect(rows).toHaveLength(6);

    const text = chartToText(rows);
    expect(text).toContain("Trend");
    expect(text).toContain("●");
    expect(text).toContain("└");
    expect(countCharacter(text, "●")).toBe(3);
  });

  it("renders a bar chart with labels and values", () => {
    const rows = renderBarRows(bar, 30, 6);
    const text = chartToText(rows);

    expect(text).toContain("Counts");
    expect(text).toContain("A");
    expect(text).toContain("B");
    expect(text).toContain("C");
    expect(text).toContain("█");
    expect(text).toContain("7");

    const valueRow = rows.find((row) =>
      row.some((segment) => segment.text.trim() === "7")
    );
    expect(valueRow).toBeDefined();
  });

  it("renders a negative bar with a distinct fill", () => {
    const negative: BarChartInfo = {
      kind: "bar",
      labels: ["loss", "gain"],
      values: [-4, 6],
      svg: "<svg />",
    };
    const text = chartToText(renderBarRows(negative, 30, 6));
    expect(text).toContain("░");
    expect(text).toContain("█");
  });

  it("dispatches chart kinds and derives titles", () => {
    expect(renderChartRows(histogram, 30, 6)).toEqual(
      renderHistogramRows(histogram, 30, 6)
    );
    expect(renderChartRows(line, 30, 6)).toEqual(
      renderLineRows(line, 30, 6)
    );
    expect(renderChartRows(bar, 30, 6)).toEqual(renderBarRows(bar, 30, 6));
    expect(chartTitle(histogram)).toBe("Counts · Histogram");
    expect(chartTitle(scatter)).toBe("Points · Scatter");
    expect(chartTitle(line)).toBe("Trend · Line");
    expect(chartTitle(bar)).toBe("Counts · Bar");
    expect(chartTitle(undefined)).toBe("Chart");
  });
});

describe("chart SVG output", () => {
  it("renders line charts to SVG", () => {
    const svg = lineToSvg(
      [
        [1, 2],
        [2, 4],
        [3, 3],
      ],
      { title: "Trend", xLabel: "X", yLabel: "Y" }
    );

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<polyline");
    expect(svg).toContain("Trend");
    expect(svg).toContain(">X</text>");
    expect(svg).toContain(">Y</text>");
    expect(svg.split("<circle").length - 1).toBe(3);
  });

  it("renders bar charts to SVG with escaped labels", () => {
    const svg = barToSvg(["<A>", "B"], [4, -2], { title: "Counts" });

    expect(svg).toContain("<svg");
    expect(svg).toContain("<rect");
    expect(svg).toContain("&lt;A&gt;");
    expect(svg).toContain("Counts");
    expect(svg.split("<rect").length - 1).toBe(2);
  });

  it("validates chart input", () => {
    expect(() => lineToSvg([])).toThrow("points array cannot be empty");
    expect(() => lineToSvg([[1, Number.NaN]])).toThrow(
      "points must contain finite numbers"
    );
    expect(() => barToSvg([], [1])).toThrow("cannot be empty");
    expect(() => barToSvg(["A"], [1, 2])).toThrow("equal lengths");
    expect(() => barToSvg(["A"], [Number.NaN])).toThrow(
      "values must be finite numbers"
    );
  });
});

function countCharacter(text: string, character: string): number {
  return [...text].filter((value) => value === character).length;
}
