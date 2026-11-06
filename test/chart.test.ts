import { describe, expect, it } from "bun:test";
import type { HistogramChartInfo, ScatterChartInfo } from "../src/core/charts";
import { createEnvironment, evaluate } from "../src/core/parser";
import {
  chartToText,
  chartTitle,
  renderChartRows,
  renderHistogramRows,
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

  it("dispatches chart kinds and derives titles", () => {
    expect(renderChartRows(histogram, 30, 6)).toEqual(
      renderHistogramRows(histogram, 30, 6)
    );
    expect(chartTitle(histogram)).toBe("Counts · Histogram");
    expect(chartTitle(scatter)).toBe("Points · Scatter");
    expect(chartTitle(undefined)).toBe("Chart");
  });
});

function countCharacter(text: string, character: string): number {
  return [...text].filter((value) => value === character).length;
}
