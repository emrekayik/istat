import type { Matrix } from "./internal/types";

type NumericArray = readonly number[];
type NumericInput = NumericArray | Matrix;

function isMatrix(value: NumericInput): value is Matrix {
  return value.length > 0 && Array.isArray(value[0]);
}

function matrixShape(matrix: Matrix, fn: string): [number, number] {
  if (matrix.length === 0 || matrix[0]!.length === 0) {
    throw new RangeError(`${fn}: matrix cannot be empty`);
  }
  const columns = matrix[0]!.length;
  if (matrix.some((row) => row.length !== columns)) {
    throw new RangeError(`${fn}: matrix rows must have equal lengths`);
  }
  if (matrix.some((row) => row.some((value) => !Number.isFinite(value)))) {
    throw new TypeError(`${fn}: matrix values must be finite numbers`);
  }
  return [matrix.length, columns];
}

function asMatrix(value: NumericInput, fn: string): Matrix {
  if (value.length === 0) throw new RangeError(`${fn}: input cannot be empty`);
  const matrix = isMatrix(value) ? value : [value];
  matrixShape(matrix, fn);
  return matrix;
}

export function transpose(matrix: NumericInput): number[][] {
  const input = asMatrix(matrix, "transpose");
  const [, columns] = matrixShape(input, "transpose");
  return Array.from({ length: columns }, (_, column) =>
    input.map((row) => row[column]!)
  );
}

export function dot(a: NumericArray, b: NumericArray): number {
  if (a.length !== b.length) {
    throw new RangeError(`dot: vector lengths must match (${a.length} vs ${b.length})`);
  }
  if (a.length === 0) throw new RangeError("dot: vectors cannot be empty");
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new TypeError("dot: vector values must be finite numbers");
    }
    total += x * y;
  }
  return total;
}

export function matmul(a: NumericInput, b: NumericInput): number | number[] | number[][] {
  const leftIsMatrix = isMatrix(a);
  const rightIsMatrix = isMatrix(b);
  const left = asMatrix(a, "matmul");
  const right = rightIsMatrix
    ? asMatrix(b, "matmul")
    : asMatrix(b.map((value) => [value]), "matmul");
  const [leftRows, leftColumns] = matrixShape(left, "matmul");
  const [rightRows, rightColumns] = matrixShape(right, "matmul");
  if (leftColumns !== rightRows) {
    throw new RangeError(
      `matmul: incompatible dimensions (${leftRows}x${leftColumns}) and (${rightRows}x${rightColumns})`
    );
  }

  const result = Array.from({ length: leftRows }, (_, row) =>
    Array.from({ length: rightColumns }, (_, column) => {
      let total = 0;
      for (let k = 0; k < leftColumns; k++) {
        total += left[row]![k]! * right[k]![column]!;
      }
      return total;
    })
  );

  if (!leftIsMatrix && !rightIsMatrix) return result[0]![0]!;
  if (!leftIsMatrix) return result[0]!;
  if (!rightIsMatrix) return result.map((row) => row[0]!);
  return result;
}

export function identity(size: number): number[][] {
  assertDimension(size, "identity");
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0))
  );
}

export function diagonal(input: NumericInput): number[] | number[][] {
  if (!isMatrix(input)) {
    if (input.length === 0) throw new RangeError("diagonal: vector cannot be empty");
    return input.map((value, index) =>
      input.map((_, column) => (column === index ? value : 0))
    );
  }
  const matrix = asMatrix(input, "diagonal");
  const [rows, columns] = matrixShape(matrix, "diagonal");
  const length = Math.min(rows, columns);
  return Array.from({ length }, (_, index) => matrix[index]![index]!);
}

export function trace(matrix: Matrix): number {
  const input = asMatrix(matrix, "trace");
  const [rows, columns] = matrixShape(input, "trace");
  if (rows !== columns) throw new RangeError("trace: matrix must be square");
  return input.reduce((total, row, index) => total + row[index]!, 0);
}

export function determinant(matrix: Matrix): number {
  const input = copySquareMatrix(matrix, "determinant");
  const size = input.length;
  let sign = 1;
  let result = 1;

  for (let column = 0; column < size; column++) {
    const pivotRow = pivotIndex(input, column, column);
    const pivot = input[pivotRow]![column]!;
    if (pivot === 0) return 0;
    if (pivotRow !== column) {
      [input[column], input[pivotRow]] = [input[pivotRow]!, input[column]!];
      sign *= -1;
    }
    const diagonalValue = input[column]![column]!;
    result *= diagonalValue;
    for (let row = column + 1; row < size; row++) {
      const factor = input[row]![column]! / diagonalValue;
      for (let k = column + 1; k < size; k++) {
        input[row]![k] = input[row]![k]! - factor * input[column]![k]!;
      }
    }
  }
  return sign * result;
}

export function solve(matrix: Matrix, values: NumericInput): number[] | number[][] {
  const input = copySquareMatrix(matrix, "solve");
  const [size] = matrixShape(input, "solve");
  const vectorInput = !isMatrix(values);
  const rhs = vectorInput
    ? asMatrix(values.map((value) => [value]), "solve")
    : asMatrix(values, "solve");
  const [rhsRows] = matrixShape(rhs, "solve");
  if (rhsRows !== size) {
    throw new RangeError(`solve: right-hand side must have ${size} rows, got ${rhsRows}`);
  }
  const augmented = input.map((row, index) => [...row, ...rhs[index]!]);
  const rhsColumns = rhs[0]!.length;

  for (let column = 0; column < size; column++) {
    const row = pivotIndex(augmented, column, column);
    if (augmented[row]![column] === 0) {
      throw new RangeError("solve: matrix is singular");
    }
    [augmented[column], augmented[row]] = [augmented[row]!, augmented[column]!];
    const pivot = augmented[column]![column]!;
    for (let k = column; k < size + rhsColumns; k++) {
      augmented[column]![k] = augmented[column]![k]! / pivot;
    }
    for (let r = 0; r < size; r++) {
      if (r === column) continue;
      const factor = augmented[r]![column]!;
      for (let k = column; k < size + rhsColumns; k++) {
        augmented[r]![k] = augmented[r]![k]! - factor * augmented[column]![k]!;
      }
    }
  }

  const result = augmented.map((row) => row.slice(size));
  return vectorInput ? result.map((row) => row[0]!) : result;
}

export function inverse(matrix: Matrix): number[][] {
  const input = copySquareMatrix(matrix, "inverse");
  return solve(input, identity(input.length)) as number[][];
}

export function matrixPower(matrix: Matrix, exponent: number): number[][] {
  const input = copySquareMatrix(matrix, "matrixPower");
  if (!Number.isInteger(exponent)) {
    throw new RangeError("matrixPower: exponent must be an integer");
  }
  if (exponent < 0) {
    return matrixPower(inverse(input), -exponent);
  }

  let power = exponent;
  let base = input;
  let result = identity(input.length);
  while (power > 0) {
    if (power % 2 === 1) result = matmul(result, base) as number[][];
    power = Math.floor(power / 2);
    if (power > 0) base = matmul(base, base) as number[][];
  }
  return result;
}

function copySquareMatrix(matrix: Matrix, fn: string): number[][] {
  const input = asMatrix(matrix, fn).map((row) => [...row]);
  if (input.length !== input[0]!.length) {
    throw new RangeError(`${fn}: matrix must be square`);
  }
  return input;
}

function pivotIndex(matrix: Matrix, column: number, startRow: number): number {
  let pivot = startRow;
  for (let row = startRow + 1; row < matrix.length; row++) {
    if (Math.abs(matrix[row]![column]!) > Math.abs(matrix[pivot]![column]!)) {
      pivot = row;
    }
  }
  return pivot;
}

function assertDimension(size: number, fn: string): void {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`${fn}: size must be a positive integer`);
  }
}
