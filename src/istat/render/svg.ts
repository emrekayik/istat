import type { Bin } from "../internal/types";

export interface SvgPadding {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface SvgChartOptions {
  /** Chart canvas width in pixels. Defaults to `640`. */
  readonly width?: number;
  /** Chart canvas height in pixels. Defaults to `400`. */
  readonly height?: number;
  /** Margins around the plot area. Defaults to `{ top: 40, right: 20, bottom: 50, left: 60 }`. */
  readonly padding?: SvgPadding;
  /** Main chart title displayed at the top. */
  readonly title?: string;
  /** Label for the horizontal X-axis. */
  readonly xLabel?: string;
  /** Label for the vertical Y-axis. */
  readonly yLabel?: string;
  /** Primary fill color for bars, points, or area (e.g., `#4a90e2`). */
  readonly fill?: string;
  /** Stroke color for lines, borders, and axes (e.g., `#333333`). */
  readonly stroke?: string;
  /** Base font size in pixels. Defaults to `12`. */
  readonly fontSize?: number;
}

const DEFAULTS: Required<
  Pick<SvgChartOptions, "width" | "height" | "fill" | "stroke" | "fontSize">
> = {
  width: 640,
  height: 400,
  fill: "#4a90e2",
  stroke: "#333333",
  fontSize: 12,
};

/**
 * Renders a histogram frequency distribution to a standalone SVG string.
 *
 * @param {readonly Bin[]} bins - Array of histogram bins containing `{ x0, x1, count }`.
 * @param {SvgChartOptions} [options={}] - Chart styling and layout options.
 * @returns {string} Standalone SVG markup string.
 *
 * @example
 * ```ts
 * import { histogram } from "../istat";
 * import { histogramToSvg } from "./svg";
 *
 * const data = [1, 2, 2, 3, 3, 3, 4, 4, 5];
 * const bins = histogram(data, { bins: 5 });
 *
 * const svg = histogramToSvg(bins, {
 *   title: "Frequency Distribution",
 *   xLabel: "Value",
 *   yLabel: "Count",
 *   fill: "#3b82f6"
 * });
 *
 * console.log(svg); // => "<svg xmlns=..."
 * ```
 */
export function histogramToSvg(
  bins: readonly Bin[],
  options: SvgChartOptions = {},
): string {
  if (bins.length === 0) {
    throw new RangeError("histogramToSvg: bins array cannot be empty");
  }

  const width = options.width ?? DEFAULTS.width;
  const height = options.height ?? DEFAULTS.height;
  const pad = options.padding ?? { top: 40, right: 20, bottom: 50, left: 60 };
  const fill = options.fill ?? DEFAULTS.fill;
  const fontSize = options.fontSize ?? DEFAULTS.fontSize;

  const firstBin = bins[0]!;
  const lastBin = bins[bins.length - 1]!;
  const x0 = firstBin.x0;
  const x1 = lastBin.x1;
  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const xRange = x1 - x0 || 1;

  // Scale functions
  const sx = (x: number) => pad.left + ((x - x0) / xRange) * plotW;
  const sy = (c: number) => pad.top + plotH - (c / maxCount) * plotH;

  // Bar rectangles
  const rects = bins
    .map((bin) => {
      const x = sx(bin.x0);
      const w = sx(bin.x1) - x;
      const y = sy(bin.count);
      const h = pad.top + plotH - y;
      // 0.5px gap so adjacent bins don't blend together
      return (
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" ` +
        `width="${Math.max(0, w - 0.5).toFixed(1)}" height="${h.toFixed(1)}" ` +
        `fill="${fill}" />`
      );
    })
    .join("\n    ");

  // Axis lines
  const axisX =
    `<line x1="${pad.left}" y1="${pad.top + plotH}" ` +
    `x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="#333" />`;
  const axisY =
    `<line x1="${pad.left}" y1="${pad.top}" ` +
    `x2="${pad.left}" y2="${pad.top + plotH}" stroke="#333" />`;

  // Ticks (nice numbers)
  const xTicks = niceTicks(x0, x1, 6)
    .map(
      (v) =>
        `<line x1="${sx(v)}" y1="${pad.top + plotH}" x2="${sx(v)}" y2="${pad.top + plotH + 5}" stroke="#333" />` +
        `<text x="${sx(v)}" y="${pad.top + plotH + 20}" text-anchor="middle" font-size="${fontSize}">${fmt(v)}</text>`,
    )
    .join("\n    ");

  const yTicks = niceTicks(0, maxCount, 5)
    .map(
      (v) =>
        `<line x1="${pad.left - 5}" y1="${sy(v)}" x2="${pad.left}" y2="${sy(v)}" stroke="#333" />` +
        `<text x="${pad.left - 8}" y="${sy(v) + fontSize / 3}" text-anchor="end" font-size="${fontSize}">${fmt(v)}</text>`,
    )
    .join("\n    ");

  const title = options.title
    ? `<text x="${width / 2}" y="${pad.top - 12}" text-anchor="middle" font-size="${fontSize + 4}" font-weight="600">${escapeXml(options.title)}</text>`
    : "";

  const xLabel = options.xLabel
    ? `<text x="${pad.left + plotW / 2}" y="${height - 10}" text-anchor="middle" font-size="${fontSize}">${escapeXml(options.xLabel)}</text>`
    : "";

  const yLabel = options.yLabel
    ? `<text transform="translate(15 ${pad.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${fontSize}">${escapeXml(options.yLabel)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="-apple-system, system-ui, sans-serif">
    ${title}
    ${rects}
    ${axisX}
    ${axisY}
    ${xTicks}
    ${yTicks}
    ${xLabel}
    ${yLabel}
  </svg>`;
}

/**
 * Renders a 2D scatter plot to a standalone SVG string.
 *
 * @param {readonly (readonly [number, number])[]} points - Array of `[x, y]` coordinates.
 * @param {SvgChartOptions} [options={}] - Chart styling and layout options.
 * @returns {string} Standalone SVG markup string.
 *
 * @example
 * ```ts
 * const points: [number, number][] = [[1, 2], [2, 4], [3, 5], [4, 4], [5, 8]];
 * const svg = scatterToSvg(points, { title: "Scatter Plot", xLabel: "X", yLabel: "Y" });
 * ```
 */
export function scatterToSvg(
  points: readonly (readonly [number, number])[],
  options: SvgChartOptions = {},
): string {
  if (points.length === 0) {
    throw new RangeError("scatterToSvg: points array cannot be empty");
  }

  const width = options.width ?? DEFAULTS.width;
  const height = options.height ?? DEFAULTS.height;
  const pad = options.padding ?? { top: 40, right: 20, bottom: 50, left: 60 };
  const fill = options.fill ?? DEFAULTS.fill;
  const fontSize = options.fontSize ?? DEFAULTS.fontSize;

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  const sx = (x: number) => pad.left + ((x - minX) / xRange) * plotW;
  const sy = (y: number) => pad.top + plotH - ((y - minY) / yRange) * plotH;

  const circles = points
    .map(
      ([x, y]) =>
        `<circle cx="${sx(x).toFixed(1)}" cy="${sy(y).toFixed(1)}" r="4" fill="${fill}" />`,
    )
    .join("\n    ");

  const axisX =
    `<line x1="${pad.left}" y1="${pad.top + plotH}" ` +
    `x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="#333" />`;
  const axisY =
    `<line x1="${pad.left}" y1="${pad.top}" ` +
    `x2="${pad.left}" y2="${pad.top + plotH}" stroke="#333" />`;

  const xTicks = niceTicks(minX, maxX, 6)
    .map(
      (v) =>
        `<line x1="${sx(v)}" y1="${pad.top + plotH}" x2="${sx(v)}" y2="${pad.top + plotH + 5}" stroke="#333" />` +
        `<text x="${sx(v)}" y="${pad.top + plotH + 20}" text-anchor="middle" font-size="${fontSize}">${fmt(v)}</text>`,
    )
    .join("\n    ");

  const yTicks = niceTicks(minY, maxY, 5)
    .map(
      (v) =>
        `<line x1="${pad.left - 5}" y1="${sy(v)}" x2="${pad.left}" y2="${sy(v)}" stroke="#333" />` +
        `<text x="${pad.left - 8}" y="${sy(v) + fontSize / 3}" text-anchor="end" font-size="${fontSize}">${fmt(v)}</text>`,
    )
    .join("\n    ");

  const title = options.title
    ? `<text x="${width / 2}" y="${pad.top - 12}" text-anchor="middle" font-size="${fontSize + 4}" font-weight="600">${escapeXml(options.title)}</text>`
    : "";

  const xLabel = options.xLabel
    ? `<text x="${pad.left + plotW / 2}" y="${height - 10}" text-anchor="middle" font-size="${fontSize}">${escapeXml(options.xLabel)}</text>`
    : "";

  const yLabel = options.yLabel
    ? `<text transform="translate(15 ${pad.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${fontSize}">${escapeXml(options.yLabel)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="-apple-system, system-ui, sans-serif">
    ${title}
    ${circles}
    ${axisX}
    ${axisY}
    ${xTicks}
    ${yTicks}
    ${xLabel}
    ${yLabel}
  </svg>`;
}

/**
 * Renders a line chart to a standalone SVG string.
 *
 * @param {readonly (readonly [number, number])[]} points - Ordered `[x, y]` coordinates.
 * @param {SvgChartOptions} [options={}] - Chart styling and layout options.
 * @returns {string} Standalone SVG markup string.
 *
 * @example
 * ```ts
 * const points: [number, number][] = [[1, 2], [2, 4], [3, 5], [4, 4], [5, 8]];
 * const svg = lineToSvg(points, { title: "Trend", xLabel: "X", yLabel: "Y" });
 * ```
 */
export function lineToSvg(
  points: readonly (readonly [number, number])[],
  options: SvgChartOptions = {},
): string {
  if (points.length === 0) {
    throw new RangeError("lineToSvg: points array cannot be empty");
  }
  if (points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
    throw new TypeError("lineToSvg: points must contain finite numbers");
  }

  const width = options.width ?? DEFAULTS.width;
  const height = options.height ?? DEFAULTS.height;
  const pad = options.padding ?? { top: 40, right: 20, bottom: 50, left: 60 };
  const fill = options.fill ?? DEFAULTS.fill;
  const stroke = options.stroke ?? fill;
  const fontSize = options.fontSize ?? DEFAULTS.fontSize;

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const sx = (x: number) =>
    minX === maxX
      ? pad.left + plotW / 2
      : pad.left + ((x - minX) / (maxX - minX)) * plotW;
  const sy = (y: number) =>
    minY === maxY
      ? pad.top + plotH / 2
      : pad.top + plotH - ((y - minY) / (maxY - minY)) * plotH;

  const linePoints = points
    .map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`)
    .join(" ");

  const polyline =
    `<polyline points="${linePoints}" fill="none" stroke="${stroke}" ` +
    `stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />`;

  const circles = points
    .map(
      ([x, y]) =>
        `<circle cx="${sx(x).toFixed(1)}" cy="${sy(y).toFixed(1)}" r="3" fill="${fill}" />`,
    )
    .join("\n    ");

  const axisX =
    `<line x1="${pad.left}" y1="${pad.top + plotH}" ` +
    `x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="#333" />`;
  const axisY =
    `<line x1="${pad.left}" y1="${pad.top}" ` +
    `x2="${pad.left}" y2="${pad.top + plotH}" stroke="#333" />`;

  const xTicks = niceTicks(minX, maxX, 6)
    .map(
      (v) =>
        `<line x1="${sx(v)}" y1="${pad.top + plotH}" x2="${sx(v)}" y2="${pad.top + plotH + 5}" stroke="#333" />` +
        `<text x="${sx(v)}" y="${pad.top + plotH + 20}" text-anchor="middle" font-size="${fontSize}">${fmt(v)}</text>`,
    )
    .join("\n    ");

  const yTicks = niceTicks(minY, maxY, 5)
    .map(
      (v) =>
        `<line x1="${pad.left - 5}" y1="${sy(v)}" x2="${pad.left}" y2="${sy(v)}" stroke="#333" />` +
        `<text x="${pad.left - 8}" y="${sy(v) + fontSize / 3}" text-anchor="end" font-size="${fontSize}">${fmt(v)}</text>`,
    )
    .join("\n    ");

  const title = options.title
    ? `<text x="${width / 2}" y="${pad.top - 12}" text-anchor="middle" font-size="${fontSize + 4}" font-weight="600">${escapeXml(options.title)}</text>`
    : "";

  const xLabel = options.xLabel
    ? `<text x="${pad.left + plotW / 2}" y="${height - 10}" text-anchor="middle" font-size="${fontSize}">${escapeXml(options.xLabel)}</text>`
    : "";

  const yLabel = options.yLabel
    ? `<text transform="translate(15 ${pad.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${fontSize}">${escapeXml(options.yLabel)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="-apple-system, system-ui, sans-serif">
    ${title}
    ${polyline}
    ${circles}
    ${axisX}
    ${axisY}
    ${xTicks}
    ${yTicks}
    ${xLabel}
    ${yLabel}
  </svg>`;
}

/**
 * Renders a categorical bar chart to a standalone SVG string.
 *
 * @param {readonly string[]} labels - Category labels, one per bar.
 * @param {readonly number[]} values - Bar values. Negative values are drawn below zero.
 * @param {SvgChartOptions} [options={}] - Chart styling and layout options.
 * @returns {string} Standalone SVG markup string.
 *
 * @example
 * ```ts
 * const svg = barToSvg(["A", "B", "C"], [4, 7, 2], { title: "Counts" });
 * ```
 */
export function barToSvg(
  labels: readonly string[],
  values: readonly number[],
  options: SvgChartOptions = {},
): string {
  if (labels.length === 0 || values.length === 0) {
    throw new RangeError("barToSvg: labels and values cannot be empty");
  }
  if (labels.length !== values.length) {
    throw new RangeError(
      `barToSvg: labels and values must have equal lengths (labels: ${labels.length}, values: ${values.length})`,
    );
  }
  if (values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("barToSvg: values must be finite numbers");
  }

  const width = options.width ?? DEFAULTS.width;
  const height = options.height ?? DEFAULTS.height;
  const pad = options.padding ?? { top: 40, right: 20, bottom: 50, left: 60 };
  const fill = options.fill ?? DEFAULTS.fill;
  const fontSize = options.fontSize ?? DEFAULTS.fontSize;

  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const valueRange = maxValue - minValue || 1;

  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const sy = (value: number) =>
    pad.top + plotH - ((value - minValue) / valueRange) * plotH;
  const baseline = sy(0);
  const slot = plotW / values.length;
  const barWidth = Math.max(1, slot * 0.8);

  const bars = values
    .map((value, index) => {
      const x = pad.left + index * slot + (slot - barWidth) / 2;
      const y = Math.min(sy(value), baseline);
      const barHeight = Math.abs(sy(value) - baseline);
      return (
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" ` +
        `width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" ` +
        `fill="${fill}" />`
      );
    })
    .join("\n    ");

  const axisX =
    `<line x1="${pad.left}" y1="${baseline}" ` +
    `x2="${pad.left + plotW}" y2="${baseline}" stroke="#333" />`;
  const axisY =
    `<line x1="${pad.left}" y1="${pad.top}" ` +
    `x2="${pad.left}" y2="${pad.top + plotH}" stroke="#333" />`;

  const rotatedLabels = labels.length > 8;
  const labelY = pad.top + plotH + (rotatedLabels ? 16 : 20);
  const xLabels = labels
    .map((label, index) => {
      const x = pad.left + index * slot + slot / 2;
      const transform = rotatedLabels
        ? ` transform="rotate(-35 ${x.toFixed(1)} ${labelY})"`
        : "";
      const anchor = rotatedLabels ? "end" : "middle";
      return `<text x="${x.toFixed(1)}" y="${labelY}" text-anchor="${anchor}" font-size="${fontSize}"${transform}>${escapeXml(label)}</text>`;
    })
    .join("\n    ");

  const yTicks = niceTicks(minValue, maxValue, 5)
    .map(
      (v) =>
        `<line x1="${pad.left - 5}" y1="${sy(v)}" x2="${pad.left}" y2="${sy(v)}" stroke="#333" />` +
        `<text x="${pad.left - 8}" y="${sy(v) + fontSize / 3}" text-anchor="end" font-size="${fontSize}">${fmt(v)}</text>`,
    )
    .join("\n    ");

  const title = options.title
    ? `<text x="${width / 2}" y="${pad.top - 12}" text-anchor="middle" font-size="${fontSize + 4}" font-weight="600">${escapeXml(options.title)}</text>`
    : "";

  const xLabel = options.xLabel
    ? `<text x="${pad.left + plotW / 2}" y="${height - 10}" text-anchor="middle" font-size="${fontSize}">${escapeXml(options.xLabel)}</text>`
    : "";

  const yLabel = options.yLabel
    ? `<text transform="translate(15 ${pad.top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${fontSize}">${escapeXml(options.yLabel)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="-apple-system, system-ui, sans-serif">
    ${title}
    ${bars}
    ${axisX}
    ${axisY}
    ${xLabels}
    ${yTicks}
    ${xLabel}
    ${yLabel}
  </svg>`;
}

// Helpers
function fmt(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(1);
  return Number(n.toFixed(2)).toString();
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

// Heckbert "nice numbers" algorithm for tick generation
function niceTicks(min: number, max: number, count: number): number[] {
  const range = max - min || 1;
  const rawStep = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  const step = niceNorm * mag;
  const start = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) {
    out.push(Math.abs(v) < step * 1e-9 ? 0 : v); // prevent negative zero (-0)
  }
  return out;
}
