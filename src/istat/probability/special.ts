export const SQRT_TWO_PI = Math.sqrt(2 * Math.PI);

/**
 * Approximates the error function using the Abramowitz-Stegun 7.1.26 formula.
 */
export function erf(x: number): number {
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

/**
 * Lanczos approximation of the natural logarithm of the gamma function.
 */
export function logGamma(value: number): number {
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
    return (
      Math.log(Math.PI) -
      Math.log(Math.abs(Math.sin(Math.PI * value))) -
      logGamma(1 - value)
    );
  }
  const z = value - 1;
  let sum = 0.99999999999980993;
  for (let i = 0; i < coefficients.length; i++) {
    sum += coefficients[i]! / (z + i + 1);
  }
  const t = z + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}
