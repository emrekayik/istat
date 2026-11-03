export function neumaierSum(data: readonly number[]): number {
  let sum = 0;
  let c = 0;
  for (const x of data) {
    const t = sum + x;
    c += Math.abs(sum) >= Math.abs(x) ? sum - t + x : x - t + sum;
    sum = t;
  }
  return sum + c;
}
