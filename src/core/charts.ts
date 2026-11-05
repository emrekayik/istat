export interface HistogramChartInfo {
  readonly kind: "histogram";
  readonly title?: string;
  readonly bins: readonly {
    readonly x0: number;
    readonly x1: number;
    readonly count: number;
  }[];
  readonly svg: string;
}

export interface ScatterChartInfo {
  readonly kind: "scatter";
  readonly title?: string;
  readonly points: readonly (readonly [number, number])[];
  readonly svg: string;
}

export type ChartInfo = HistogramChartInfo | ScatterChartInfo;
