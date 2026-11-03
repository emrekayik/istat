import type { Data } from "./types";

export function assertNonEmpty(data: Data, fn: string): void {
  if (data.length === 0) {
    throw new RangeError(`${fn}: data array cannot be empty`);
  }
}

export function assertMinLength(data: Data, minLength: number, fn: string): void {
  if (data.length < minLength) {
    throw new RangeError(
      `${fn}: at least ${minLength} elements required, got ${data.length}`
    );
  }
}

export function assertEqualLengths(x: Data, y: Data, fn: string): void {
  if (x.length !== y.length) {
    throw new RangeError(
      `${fn}: array lengths must be equal (x: ${x.length}, y: ${y.length})`
    );
  }
}

export function assertInRange(
  val: number,
  min: number,
  max: number,
  name: string,
  fn: string
): void {
  if (val < min || val > max || Number.isNaN(val)) {
    throw new RangeError(
      `${fn}: ${name} must be within [${min}, ${max}], got ${val}`
    );
  }
}

export function assertFinite(val: number, name: string, fn: string): void {
  if (!Number.isFinite(val)) {
    throw new TypeError(
      `${fn}: ${name} must be a valid, finite number, got ${val}`
    );
  }
}
