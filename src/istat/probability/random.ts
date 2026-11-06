/**
 * 0 (dahil) ile 1 (hariç) arasında düzgün dağılımlı rastgele bir sayı üretir.
 * Opsiyonel olarak min ve max değerleri verilebilir.
 */
export function runif(min = 0, max = 1): number {
  if (min >= max) throw new RangeError("runif: max must be greater than min");
  return Math.random() * (max - min) + min;
}

/**
 * Box-Muller transformasyonu kullanarak normal dağılımdan rastgele bir sayı üretir.
 */
export function rnormSingle(mean = 0, std = 1): number {
  if (std <= 0)
    throw new RangeError("rnormSingle: standard deviation must be positive");
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * std + mean;
}

/**
 * Belirtilen uzunlukta, normal dağılımlı rastgele bir dizi üretir (R'deki rnorm gibi).
 * İstatistiksel simülasyonlar için en çok ihtiyaç duyulan fonksiyondur.
 */
export function rnorm(n: number, mean = 0, std = 1): number[] {
  if (n <= 0 || !Number.isInteger(n)) {
    throw new RangeError("rnorm: n must be a positive integer");
  }
  return Array.from({ length: n }, () => rnormSingle(mean, std));
}

/**
 * Belirtilen uzunlukta, düzgün dağılımlı rastgele bir dizi üretir (R'deki runif gibi).
 */
export function runifArray(n: number, min = 0, max = 1): number[] {
  if (n <= 0 || !Number.isInteger(n)) {
    throw new RangeError("runifArray: n must be a positive integer");
  }
  return Array.from({ length: n }, () => runif(min, max));
}
