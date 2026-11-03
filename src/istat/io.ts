import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ReadDataOptions {
  /** Worksheet name or zero-based worksheet index. Defaults to the first sheet. */
  readonly sheet?: string | number;
  /** Interpret the first row as object keys. Defaults to `true`. */
  readonly header?: boolean;
}

/**
 * Reads a CSV, XLSX, or JSON file from disk.
 * CSV and spreadsheet files return records keyed by their first row by default.
 */
export function readData(
  filePath: string,
  options: ReadDataOptions = {}
): unknown {
  const path = resolve(filePath);
  const extension = path.split(".").pop()?.toLowerCase();

  if (extension === "json") {
    return readJson(path);
  }
  if (extension === "csv") {
    return readTabularFile(path, options);
  }
  if (extension === "xlsx" || extension === "xls") {
    return readTabularFile(path, options);
  }
  throw new TypeError(
    `readData: unsupported file type '.${extension ?? ""}'. Supported types are .csv, .xlsx, .xls, and .json`
  );
}

export function readJson(filePath: string): unknown {
  const path = resolve(filePath);
  const text = readFileSync(path, "utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SyntaxError(`readJson: invalid JSON in '${path}': ${error.message}`);
    }
    throw error;
  }
}

export function readCsv(filePath: string, header = true): unknown[] {
  return readTabularFile(resolve(filePath), { header });
}

export function readXlsx(
  filePath: string,
  sheet?: string | number,
  header = true
): unknown[] {
  return readTabularFile(resolve(filePath), { sheet, header });
}

export function column(
  rows: readonly unknown[],
  key: string | number
): unknown[] {
  if (rows.length === 0) throw new RangeError("column: input cannot be empty");
  if (typeof key === "number" && (!Number.isInteger(key) || key < 1)) {
    throw new RangeError("column: numeric column index must be a positive 1-based integer");
  }
  return rows.map((row, index) => {
    if (Array.isArray(row)) {
      if (typeof key !== "number") {
        throw new TypeError("column: array rows require a numeric column index");
      }
      const value = row[key - 1];
      if (value === undefined) {
        throw new RangeError(`column: index ${key} is missing from row ${index + 1}`);
      }
      return value;
    }
    if (typeof row === "object" && row !== null) {
      if (typeof key !== "string") {
        throw new TypeError("column: object rows require a string column name");
      }
      if (!Object.hasOwn(row, key)) {
        throw new ReferenceError(`column: column '${key}' not found in row ${index + 1}`);
      }
      return (row as Record<string, unknown>)[key];
    }
    throw new TypeError(`column: row ${index + 1} is not a record or array`);
  });
}

function readTabularFile(
  filePath: string,
  options: ReadDataOptions
): unknown[] {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName =
    typeof options.sheet === "string"
      ? options.sheet
      : workbook.SheetNames[options.sheet ?? 0];
  if (!sheetName || !workbook.Sheets[sheetName]) {
    throw new RangeError(`readData: worksheet '${String(options.sheet)}' not found`);
  }

  const worksheet = workbook.Sheets[sheetName]!;
  if (options.header === false) {
    return XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: null,
      raw: true,
    });
  }
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
    raw: true,
  });
}
