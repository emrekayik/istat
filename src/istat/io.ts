import * as XLSX from "xlsx";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ReadDataOptions {
  /** Worksheet name or zero-based worksheet index. Defaults to the first sheet. */
  readonly sheet?: string | number;
  /** Interpret the first row as object keys. Defaults to `true`. */
  readonly header?: boolean;
}

export interface WriteDataOptions {
  /** Include a header row for record data. Defaults to `true`. */
  readonly header?: boolean;
  /** Worksheet name used when writing an XLSX file. Defaults to `Sheet1`. */
  readonly sheet?: string;
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

/**
 * Writes a CSV, XLSX, or JSON file, choosing the format from the extension.
 * CSV and spreadsheet writers accept arrays of records, arrays of rows, or a
 * single record.
 */
export function writeData(
  filePath: string,
  data: unknown,
  options: WriteDataOptions = {}
): string {
  const path = resolve(filePath);
  const extension = path.split(".").pop()?.toLowerCase();

  if (extension === "json") {
    return writeJson(path, data);
  }
  if (extension === "csv") {
    return writeCsv(path, data, options.header ?? true);
  }
  if (extension === "xlsx" || extension === "xls") {
    return writeXlsx(path, data, options);
  }
  throw new TypeError(
    `writeData: unsupported file type '.${extension ?? ""}'. Supported types are .csv, .xlsx, .xls, and .json`
  );
}

export function writeJson(filePath: string, data: unknown): string {
  const path = resolve(filePath);
  if (data === undefined) {
    throw new TypeError("writeJson: data cannot be undefined");
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  return `Saved JSON to ${path}`;
}

export function writeCsv(
  filePath: string,
  data: unknown,
  header = true
): string {
  const path = resolve(filePath);
  const rows = tabularRows(data, "writeCsv", header);
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  writeFileSync(path, content.length > 0 ? content + "\n" : "", "utf8");
  return `Saved CSV to ${path}`;
}

export function writeXlsx(
  filePath: string,
  data: unknown,
  options: WriteDataOptions = {}
): string {
  const path = resolve(filePath);
  const rows = tabularRows(data, "writeXlsx", options.header ?? true);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheet ?? "Sheet1");
  const extension = path.split(".").pop()?.toLowerCase();
  XLSX.writeFile(
    workbook,
    path,
    extension === "xls" ? { bookType: "biff8" } : undefined
  );
  return `Saved ${extension === "xls" ? "XLS" : "XLSX"} to ${path}`;
}

function tabularRows(
  data: unknown,
  fn: string,
  header: boolean
): unknown[][] {
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    if (data.every((row) => Array.isArray(row))) {
      return data.map((row) => [...(row as unknown[])]);
    }
    if (
      data.every(
        (row) =>
          !Array.isArray(row) && typeof row === "object" && row !== null
      )
    ) {
      const headers: string[] = [];
      for (const row of data) {
        for (const key of Object.keys(row as Record<string, unknown>)) {
          if (!headers.includes(key)) headers.push(key);
        }
      }
      const rows = data.map((row) =>
        headers.map((key) => (row as Record<string, unknown>)[key])
      );
      return header ? [headers, ...rows] : rows;
    }
    if (data.every((value) => typeof value !== "object" || value === null)) {
      const rows = data.map((value) => [value]);
      return header ? [["value"], ...rows] : rows;
    }
    throw new TypeError(
      `${fn}: data must contain rows of the same shape (all arrays or all records)`
    );
  }

  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    const headers = Object.keys(record);
    const values = headers.map((key) => record[key]);
    return header ? [headers, values] : [values];
  }

  throw new TypeError(`${fn}: data must be an array or record`);
}

function csvCell(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value))
  ) {
    return "";
  }

  let text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? (JSON.stringify(value) ?? String(value))
        : String(value);
  if (/[",\n\r]/.test(text) || /^\s|\s$/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
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
