import { assertInRange } from "./internal/validate";

const SQRT_TWO_PI = Math.sqrt(2 * Math.PI);

export function normalPdf(x: number, mean = 0, standardDeviation = 1): number {
  assertFinite(x, "x", "normalPdf");
  assertFinite(mean, "mean", "normalPdf");
  assertPositive(standardDeviation, "standardDeviation", "normalPdf");
  const z = (x - mean) / standardDeviation;
  return Math.exp(-0.5 * z * z) / (SQRT_TWO_PI * standardDeviation);
}

export function normalCdf(x: number, mean = 0, standardDeviation = 1): number {
  assertFinite(x, "x", "normalCdf");
  assertFinite(mean, "mean", "normalCdf");
  assertPositive(standardDeviation, "standardDeviation", "normalCdf");
  const z = (x - mean) / (standardDeviation * Math.sqrt(2));
  return 0.5 * (1 + erf(z));
}

export function binomialPmf(k: number, trials: number, probability: number): number {
  assertInteger(trials, "trials", "binomialPmf");
  if (trials < 0) throw new RangeError("binomialPmf: trials must be non-negative");
  assertInRange(probability, 0, 1, "probability", "binomialPmf");
  assertInteger(k, "k", "binomialPmf");
  if (k < 0 || k > trials) return 0;
  if (probability === 0) return k === 0 ? 1 : 0;
  if (probability === 1) return k === trials ? 1 : 0;
  return Math.exp(
    logGamma(trials + 1) -
      logGamma(k + 1) -
      logGamma(trials - k + 1) +
      k * Math.log(probability) +
      (trials - k) * Math.log1p(-probability)
  );
}

export function binomialCdf(k: number, trials: number, probability: number): number {
  assertInteger(k, "k", "binomialCdf");
  assertInteger(trials, "trials", "binomialCdf");
  if (trials < 0) throw new RangeError("binomialCdf: trials must be non-negative");
  assertInRange(probability, 0, 1, "probability", "binomialCdf");
  if (k < 0) return 0;
  if (k >= trials) return 1;
  let total = 0;
  for (let i = 0; i <= k; i++) total += binomialPmf(i, trials, probability);
  return Math.min(1, total);
}

export function poissonPmf(k: number, rate: number): number {
  assertInteger(k, "k", "poissonPmf");
  if (k < 0) return 0;
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError("poissonPmf: rate must be a non-negative finite number");
  }
  if (rate === 0) return k === 0 ? 1 : 0;
  return Math.exp(k * Math.log(rate) - rate - logGamma(k + 1));
}

export function poissonCdf(k: number, rate: number): number {
  assertInteger(k, "k", "poissonCdf");
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError("poissonCdf: rate must be a non-negative finite number");
  }
  if (k < 0) return 0;
  let total = 0;
  for (let i = 0; i <= k; i++) total += poissonPmf(i, rate);
  return Math.min(1, total);
}

export function uniformPdf(x: number, min = 0, max = 1): number {
  validateUniformBounds(min, max, "uniformPdf");
  assertFinite(x, "x", "uniformPdf");
  return x < min || x > max ? 0 : 1 / (max - min);
}

export function uniformCdf(x: number, min = 0, max = 1): number {
  validateUniformBounds(min, max, "uniformCdf");
  assertFinite(x, "x", "uniformCdf");
  if (x <= min) return 0;
  if (x >= max) return 1;
  return (x - min) / (max - min);
}

function validateUniformBounds(min: number, max: number, fn: string): void {
  assertFinite(min, "min", fn);
  assertFinite(max, "max", fn);
  if (min >= max) throw new RangeError(`${fn}: max must be greater than min`);
}

function assertFinite(value: number, name: string, fn: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${fn}: ${name} must be finite`);
}

function assertPositive(value: number, name: string, fn: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${fn}: ${name} must be a positive finite number`);
  }
}

function assertInteger(value: number, name: string, fn: string): void {
  if (!Number.isInteger(value)) throw new RangeError(`${fn}: ${name} must be an integer`);
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const value = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * value);
  const polynomial =
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
      0.284496736) *
      t +
      0.254829592) *
      t);
  return sign * (1 - polynomial * Math.exp(-value * value));
}

function logGamma(value: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }
  const z = value - 1;
  let sum = 0.99999999999980993;
  for (let i = 0; i < coefficients.length; i++) {
    sum += coefficients[i]! / (z + i + 1);
  }
  const t = z + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}
