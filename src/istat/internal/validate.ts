export function assertNonEmpty(data: Data, fn: string): void {
  if (data.length === 0) {
    throw new RangeError(`${fn}: veri dizisi boş olamaz`);
  }
}
