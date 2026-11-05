/**
 * Returns true when a command result is SVG markup that can be written to a file.
 */
export function isSvg(value: unknown): value is string {
  return typeof value === "string" && value.includes("<svg");
}
