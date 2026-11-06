import type {
  BarChartInfo,
  ChartInfo,
  HistogramChartInfo,
  LineChartInfo,
  ScatterChartInfo,
} from "../core/charts";

export type ChartTone = "title" | "axis" | "bar" | "point" | "label" | "muted";

export interface ChartSegment {
  readonly text: string;
  readonly tone: ChartTone;
}

export type ChartRow = ChartSegment[];

const BLOCKS = [" ", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

/**
 * Renders a chart as terminal rows. The TUI maps each tone to a color; the
 * plain text is also useful for tests and non-color terminals.
 */
export function renderChartRows(
  chart: ChartInfo,
  width: number,
  height: number
): ChartRow[] {
  switch (chart.kind) {
    case "histogram":
      return renderHistogramRows(chart, width, height);
    case "line":
      return renderLineRows(chart, width, height);
    case "bar":
      return renderBarRows(chart, width, height);
    case "scatter":
    default:
      return renderScatterRows(chart, width, height);
  }
}

export function renderHistogramRows(
  chart: HistogramChartInfo,
  width: number,
  height: number
): ChartRow[] {
  if (chart.bins.length === 0) {
    return [[{ text: "No histogram data.", tone: "muted" }]];
  }

  const canvasWidth = Math.max(16, Math.floor(width));
  const canvasHeight = Math.max(4, Math.floor(height));
  const rows: ChartRow[] = [];
  const title = chart.title?.trim();

  if (title) {
    rows.push([{ text: centerText(title, canvasWidth), tone: "title" }]);
  }

  const maxCount = Math.max(1, ...chart.bins.map((bin) => bin.count));
  const labelWidth = Math.min(
    7,
    Math.max(4, formatNumber(maxCount).length + 1)
  );
  const plotWidth = Math.max(8, canvasWidth - labelWidth);
  const plotHeight = Math.max(1, canvasHeight - rows.length - 2);

  const binCount = chart.bins.length;
  const gap = binCount > 1 && plotWidth >= binCount * 2 ? 1 : 0;
  const barWidth = Math.max(
    1,
    Math.floor((plotWidth - gap * (binCount - 1)) / binCount)
  );
  const usedWidth = barWidth * binCount + gap * (binCount - 1);
  const extraWidth = Math.max(0, plotWidth - usedWidth);

  const binForColumn: number[] = [];
  for (let column = 0; column < plotWidth; column += 1) {
    let index = -1;
    let cursor = 0;
    for (let bin = 0; bin < binCount; bin += 1) {
      const width = barWidth + (bin === binCount - 1 ? extraWidth : 0);
      if (column >= cursor && column < cursor + width) {
        index = bin;
        break;
      }
      cursor += width + gap;
    }
    binForColumn.push(index);
  }

  for (let row = 0; row < plotHeight; row += 1) {
    const cellFromBottom = plotHeight - 1 - row;
    const segments: ChartSegment[] = [
      {
        text: padStart(yLabelForRow(row, plotHeight, maxCount), labelWidth),
        tone: "label",
      },
    ];

    for (const index of binForColumn) {
      if (index < 0) {
        segments.push({ text: " ", tone: "muted" });
        continue;
      }
      const bin = chart.bins[index]!;
      const subCells = (bin.count / maxCount) * plotHeight * 8;
      const level = clamp(Math.round(subCells - cellFromBottom * 8), 0, 8);
      segments.push({
        text: BLOCKS[level]!,
        tone: level > 0 ? "bar" : "muted",
      });
    }

    rows.push(segments);
  }

  rows.push([
    { text: " ".repeat(labelWidth), tone: "axis" },
    { text: "└" + "─".repeat(plotWidth - 1), tone: "axis" },
  ]);

  const first = chart.bins[0]!;
  const last = chart.bins[chart.bins.length - 1]!;
  rows.push([
    { text: " ".repeat(labelWidth), tone: "label" },
    {
      text: xLabels(formatNumber(first.x0), formatNumber(last.x1), plotWidth),
      tone: "label",
    },
  ]);

  return rows;
}

export function renderScatterRows(
  chart: ScatterChartInfo,
  width: number,
  height: number
): ChartRow[] {
  if (chart.points.length === 0) {
    return [[{ text: "No scatter data.", tone: "muted" }]];
  }

  const canvasWidth = Math.max(16, Math.floor(width));
  const canvasHeight = Math.max(4, Math.floor(height));
  const rows: ChartRow[] = [];
  const title = chart.title?.trim();

  if (title) {
    rows.push([{ text: centerText(title, canvasWidth), tone: "title" }]);
  }

  const xs = chart.points.map((point) => point[0]);
  const ys = chart.points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const labelWidth = Math.min(
    7,
    Math.max(
      4,
      Math.max(formatNumber(minY).length, formatNumber(maxY).length) + 1
    )
  );
  const plotWidth = Math.max(8, canvasWidth - labelWidth);
  const plotHeight = Math.max(1, canvasHeight - rows.length - 2);
  const grid = Array.from({ length: plotHeight }, () =>
    new Array<number>(plotWidth).fill(0)
  );

  for (const [x, y] of chart.points) {
    const xRatio = maxX === minX ? 0.5 : (x - minX) / (maxX - minX);
    const yRatio = maxY === minY ? 0.5 : (y - minY) / (maxY - minY);
    const column = clamp(Math.round(xRatio * (plotWidth - 1)), 0, plotWidth - 1);
    const row = clamp(
      plotHeight - 1 - Math.round(yRatio * (plotHeight - 1)),
      0,
      plotHeight - 1
    );
    grid[row]![column] = (grid[row]![column] ?? 0) + 1;
  }

  for (let row = 0; row < plotHeight; row += 1) {
    const segments: ChartSegment[] = [
      {
        text: padStart(
          scatterYLabelForRow(row, plotHeight, minY, maxY),
          labelWidth
        ),
        tone: "label",
      },
    ];

    for (let column = 0; column < plotWidth; column += 1) {
      const count = grid[row]![column]!;
      segments.push({
        text: count > 0 ? "●" : " ",
        tone: count > 0 ? "point" : "muted",
      });
    }

    rows.push(segments);
  }

  rows.push([
    { text: " ".repeat(labelWidth), tone: "axis" },
    { text: "└" + "─".repeat(plotWidth - 1), tone: "axis" },
  ]);
  rows.push([
    { text: " ".repeat(labelWidth), tone: "label" },
    {
      text: xLabels(formatNumber(minX), formatNumber(maxX), plotWidth),
      tone: "label",
    },
  ]);

  return rows;
}

export function renderLineRows(
  chart: LineChartInfo,
  width: number,
  height: number
): ChartRow[] {
  if (chart.points.length === 0) {
    return [[{ text: "No line data.", tone: "muted" }]];
  }

  const canvasWidth = Math.max(16, Math.floor(width));
  const canvasHeight = Math.max(4, Math.floor(height));
  const rows: ChartRow[] = [];
  const title = chart.title?.trim();

  if (title) {
    rows.push([{ text: centerText(title, canvasWidth), tone: "title" }]);
  }

  const xs = chart.points.map((point) => point[0]);
  const ys = chart.points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const labelWidth = Math.min(
    7,
    Math.max(
      4,
      Math.max(formatNumber(minY).length, formatNumber(maxY).length) + 1
    )
  );
  const plotWidth = Math.max(8, canvasWidth - labelWidth);
  const plotHeight = Math.max(1, canvasHeight - rows.length - 2);
  const grid = Array.from({ length: plotHeight }, () =>
    new Array<string>(plotWidth).fill(" ")
  );

  const columnFor = (x: number) =>
    maxX === minX
      ? Math.floor((plotWidth - 1) / 2)
      : clamp(Math.round(((x - minX) / (maxX - minX)) * (plotWidth - 1)), 0, plotWidth - 1);
  const rowFor = (y: number) =>
    maxY === minY
      ? Math.floor((plotHeight - 1) / 2)
      : clamp(
          plotHeight - 1 - Math.round(((y - minY) / (maxY - minY)) * (plotHeight - 1)),
          0,
          plotHeight - 1
        );

  for (let index = 1; index < chart.points.length; index += 1) {
    const [x0, y0] = chart.points[index - 1]!;
    const [x1, y1] = chart.points[index]!;
    drawLine(grid, columnFor(x0), rowFor(y0), columnFor(x1), rowFor(y1));
  }

  for (const [x, y] of chart.points) {
    const column = columnFor(x);
    const row = rowFor(y);
    grid[row]![column] = "●";
  }

  for (let row = 0; row < plotHeight; row += 1) {
    const segments: ChartSegment[] = [
      {
        text: padStart(
          scatterYLabelForRow(row, plotHeight, minY, maxY),
          labelWidth
        ),
        tone: "label",
      },
    ];

    for (let column = 0; column < plotWidth; column += 1) {
      const cell = grid[row]![column]!;
      segments.push({
        text: cell,
        tone: cell === " " ? "muted" : cell === "●" ? "point" : "bar",
      });
    }

    rows.push(segments);
  }

  rows.push([
    { text: " ".repeat(labelWidth), tone: "axis" },
    { text: "└" + "─".repeat(plotWidth - 1), tone: "axis" },
  ]);
  rows.push([
    { text: " ".repeat(labelWidth), tone: "label" },
    {
      text: xLabels(formatNumber(minX), formatNumber(maxX), plotWidth),
      tone: "label",
    },
  ]);

  return rows;
}

export function renderBarRows(
  chart: BarChartInfo,
  width: number,
  height: number
): ChartRow[] {
  if (chart.values.length === 0) {
    return [[{ text: "No bar data.", tone: "muted" }]];
  }
  if (chart.labels.length !== chart.values.length) {
    return [[{ text: "Bar labels and values do not match.", tone: "muted" }]];
  }

  const canvasWidth = Math.max(16, Math.floor(width));
  const canvasHeight = Math.max(4, Math.floor(height));
  const rows: ChartRow[] = [];
  const title = chart.title?.trim();

  if (title) {
    rows.push([{ text: centerText(title, canvasWidth), tone: "title" }]);
  }

  const maxLabelLength = Math.max(...chart.labels.map((label) => label.length));
  const labelWidth = Math.min(
    Math.max(3, maxLabelLength),
    Math.max(4, Math.floor(canvasWidth * 0.35))
  );
  const valueWidth = Math.max(
    ...chart.values.map((value) => formatNumber(value).length)
  );
  const barWidth = Math.max(1, canvasWidth - labelWidth - valueWidth - 3);
  const maxAbs = Math.max(1, ...chart.values.map((value) => Math.abs(value)));
  const available = Math.max(1, canvasHeight - rows.length);
  const showEllipsis = chart.values.length > available;
  const visibleCount = showEllipsis ? Math.max(1, available - 1) : chart.values.length;

  for (let index = 0; index < visibleCount; index += 1) {
    const value = chart.values[index]!;
    const label = fitText(chart.labels[index]!, labelWidth).padEnd(labelWidth);
    const length = Math.max(
      0,
      Math.round((Math.abs(value) / maxAbs) * barWidth)
    );
    const bar = (value < 0 ? "░" : "█").repeat(length);
    const valueText = formatNumber(value).padStart(valueWidth);

    rows.push([
      { text: label, tone: "label" },
      { text: " ", tone: "muted" },
      { text: bar, tone: value < 0 ? "muted" : "bar" },
      { text: " ".repeat(Math.max(0, barWidth - length)), tone: "muted" },
      { text: ` ${valueText}`, tone: "label" },
    ]);
  }

  if (showEllipsis) {
    rows.push([
      {
        text: `… ${chart.values.length - visibleCount} more`,
        tone: "muted",
      },
    ]);
  }

  return rows;
}

export function chartTitle(chart: ChartInfo | undefined): string {
  if (!chart) return "Chart";
  const label =
    chart.kind === "histogram"
      ? "Histogram"
      : chart.kind === "scatter"
        ? "Scatter"
        : chart.kind === "line"
          ? "Line"
          : "Bar";
  return chart.title?.trim() ? `${chart.title.trim()} · ${label}` : label;
}

export function chartToText(rows: readonly ChartRow[]): string {
  return rows
    .map((row) => row.map((segment) => segment.text).join(""))
    .join("\n");
}

function drawLine(
  grid: string[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number
): void {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    if (grid[y]?.[x] === undefined) return;
    if (grid[y]![x] === " ") {
      grid[y]![x] = "·";
    }
    if (x === x1 && y === y1) return;

    const doubled = 2 * error;
    let stepX = false;
    let stepY = false;
    if (doubled >= dy) {
      error += dy;
      x += sx;
      stepX = true;
    }
    if (doubled <= dx) {
      error += dx;
      y += sy;
      stepY = true;
    }

    const previousX = x - (stepX ? sx : 0);
    const previousY = y - (stepY ? sy : 0);
    if (grid[previousY]?.[previousX] !== undefined) {
      grid[previousY]![previousX] =
        stepX && stepY ? (sy < 0 ? "╱" : "╲") : stepX ? "─" : "│";
    }
  }
}

function yLabelForRow(row: number, height: number, max: number): string {
  if (row === 0) return formatNumber(max);
  if (row === height - 1) return "0";
  if (row === Math.floor((height - 1) / 2)) return formatNumber(max / 2);
  return "";
}

function scatterYLabelForRow(
  row: number,
  height: number,
  min: number,
  max: number
): string {
  if (row === 0) return formatNumber(max);
  if (row === height - 1) return formatNumber(min);
  if (row === Math.floor((height - 1) / 2)) {
    return formatNumber((min + max) / 2);
  }
  return "";
}

function xLabels(left: string, right: string, width: number): string {
  if (left.length + right.length + 1 > width) {
    return fitText(left, width);
  }
  return left + " ".repeat(width - left.length - right.length) + right;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Number.isInteger(value)) return String(value);
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000 || (absolute > 0 && absolute < 0.001)) {
    return value.toExponential(1);
  }
  return String(Number(value.toFixed(2)));
}

function centerText(text: string, width: number): string {
  const fitted = fitText(text, width);
  const left = Math.max(0, Math.floor((width - fitted.length) / 2));
  return " ".repeat(left) + fitted;
}

function fitText(text: string, width: number): string {
  if (text.length <= width) return text;
  if (width <= 1) return text.slice(0, width);
  return text.slice(0, width - 1) + "…";
}

function padStart(text: string, width: number): string {
  if (text.length >= width) return fitText(text, width);
  return " ".repeat(width - text.length) + text;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
