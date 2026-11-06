import { assertInRange } from "../internal/validate";

/**
 * Returns true when a value is a finite number.
 */
export function assertFinite(value: number, name: string, fn: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${fn}: ${name} must be finite`);
  }
}

/**
 * Returns true when a value is a positive finite number.
 */
export function assertPositive(value: number, name: string, fn: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${fn}: ${name} must be a positive finite number`);
  }
}

/**
 * Returns true when a value is an integer.
 */
export function assertInteger(value: number, name: string, fn: string): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${fn}: ${name} must be an integer`);
  }
}

export { assertInRange };
