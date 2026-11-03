export type Data = readonly number[];
export type Pair = readonly [number, number];
export type Matrix = readonly (readonly number[])[];

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface Bin {
  readonly x0: number;
  readonly x1: number;
  readonly count: number;
}

export interface LinearRegressionResult {
  readonly slope: number;
  readonly intercept: number;
  readonly r2: number;
  predict(x: number): number;
}

export interface PolynomialRegressionResult {
  readonly coefficients: readonly number[]; // [a0, a1, a2, ...] for a0 + a1*x + a2*x^2 + ...
  readonly degree: number;
  readonly r2: number;
  predict(x: number): number;
}

export interface DescriptiveSummary {
  readonly count: number;
  readonly min: number;
  readonly max: number;
  readonly sum: number;
  readonly mean: number;
  readonly variance: number;
  readonly stdev: number;
  readonly median: number;
}
