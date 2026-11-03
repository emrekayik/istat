import * as fs from "fs";
import * as istat from "../istat";
import type {
  Program,
  Statement,
  Expression,
  BinaryExpression,
  UnaryExpression,
  RangeExpression,
  ArrayLiteral,
  CallExpression,
  Identifier,
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  IndexExpression,
  PropertyAccess,
} from "./ast";

export interface ExecutionResult {
  /** The value of the last evaluated statement. */
  lastValue: any;
  /** Log outputs formatted for display (statements not terminated with semicolon). */
  outputs: { name?: string; value: any; formatted: string }[];
}

export class Environment {
  private variables = new Map<string, any>();
  private functions = new Map<string, (...args: any[]) => any>();

  constructor(private readonly parent?: Environment) {
    if (!parent) {
      this.registerBuiltins();
    }
  }

  createChild(): Environment {
    return new Environment(this);
  }

  set(name: string, value: any): void {
    this.variables.set(name, value);
  }

  get(name: string): any {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    if (this.functions.has(name)) {
      return this.functions.get(name);
    }
    if (this.parent?.hasFunction(name)) {
      return this.parent.getFunction(name);
    }
    if (name === "pi") return Math.PI;
    if (name === "e") return Math.E;
    if (name === "inf" || name === "Inf") return Infinity;
    if (name === "nan" || name === "NaN") return NaN;

    throw new ReferenceError(`Undefined variable or function '${name}'`);
  }

  has(name: string): boolean {
    return (
      this.variables.has(name) ||
      this.functions.has(name) ||
      Boolean(this.parent?.hasFunction(name)) ||
      name === "pi" ||
      name === "e" ||
      name === "inf" ||
      name === "nan"
    );
  }

  getVariables(): Map<string, any> {
    return new Map(this.variables);
  }

  clearVariables(): void {
    this.variables.clear();
  }

  registerFunction(name: string, fn: (...args: any[]) => any): void {
    this.functions.set(name, fn);
  }

  private hasFunction(name: string): boolean {
    return this.functions.has(name) || Boolean(this.parent?.hasFunction(name));
  }

  private getFunction(name: string): (...args: any[]) => any {
    const fn = this.functions.get(name);
    if (fn) return fn;
    if (this.parent) return this.parent.getFunction(name);
    throw new ReferenceError(`Undefined function '${name}'`);
  }

  private registerBuiltins(): void {
    // --- istat Descriptive Statistics ---
    this.registerFunction("mean", (data) => istat.mean(toArray(data)));
    this.registerFunction("median", (data) => istat.median(toArray(data)));
    this.registerFunction("variance", (data, sample = true) =>
      istat.variance(toArray(data), Boolean(sample))
    );
    this.registerFunction("var", (data, sample = true) =>
      istat.variance(toArray(data), Boolean(sample))
    );
    this.registerFunction("stdev", (data, sample = true) =>
      istat.stdev(toArray(data), Boolean(sample))
    );
    this.registerFunction("std", (data, sample = true) =>
      istat.stdev(toArray(data), Boolean(sample))
    );
    this.registerFunction("quantile", (data, p, method = "linear") =>
      istat.quantile(toArray(data), Number(p), { method: method as any })
    );
    this.registerFunction("summary", (data) => istat.summary(toArray(data)));
    this.registerFunction("readData", (path, sheet) =>
      istat.readData(String(path), sheet === undefined ? {} : { sheet: sheet as string | number })
    );
    this.registerFunction("readCsv", (path, header = true) =>
      istat.readCsv(String(path), Boolean(header))
    );
    this.registerFunction("readXlsx", (path, sheet, header = true) =>
      istat.readXlsx(
        String(path),
        sheet === undefined ? undefined : (sheet as string | number),
        Boolean(header)
      )
    );
    this.registerFunction("readJson", (path) => istat.readJson(String(path)));
    this.registerFunction("column", (rows, key) =>
      istat.column(rows, key as string | number)
    );
    this.registerFunction("now", () => istat.now());
    this.registerFunction("tic", () => istat.tic());
    this.registerFunction("toc", (startTime) => istat.toc(Number(startTime)));
    this.registerFunction("benchmark", (callback, iterations = 100, warmup = 1) =>
      istat.benchmark(callback, Number(iterations), Number(warmup))
    );
    this.registerFunction("mode", (data) => istat.mode(toArray(data)));
    this.registerFunction("skewness", (data) => istat.skewness(toArray(data)));
    this.registerFunction("kurtosis", (data) => istat.kurtosis(toArray(data)));
    this.registerFunction("zscore", (data) => istat.zscore(toArray(data)));
    this.registerFunction("covarianceMatrix", (data, sample = true) =>
      istat.covarianceMatrix(data, Boolean(sample))
    );
    this.registerFunction("histogram", (data, bins = "sturges") =>
      istat.histogram(toArray(data), { bins: typeof bins === "number" ? bins : (bins as any) })
    );
    this.registerFunction("hist", (data, bins = "sturges") =>
      istat.histogram(toArray(data), { bins: typeof bins === "number" ? bins : (bins as any) })
    );

    // --- istat Correlation ---
    this.registerFunction("covariance", (x, y, sample = true) =>
      istat.covariance(toArray(x), toArray(y), Boolean(sample))
    );
    this.registerFunction("cov", (x, y, sample = true) =>
      istat.covariance(toArray(x), toArray(y), Boolean(sample))
    );
    this.registerFunction("pearson", (x, y) =>
      istat.pearson(toArray(x), toArray(y))
    );
    this.registerFunction("corr", (x, y) =>
      istat.pearson(toArray(x), toArray(y))
    );
    this.registerFunction("spearman", (x, y) =>
      istat.spearman(toArray(x), toArray(y))
    );

    // --- istat Regression ---
    this.registerFunction("linreg", (x, y) =>
      istat.linearRegression(toArray(x), toArray(y))
    );
    this.registerFunction("linearRegression", (x, y) =>
      istat.linearRegression(toArray(x), toArray(y))
    );
    this.registerFunction("polyfit", (x, y, degree = 2) =>
      istat.polynomialRegression(toArray(x), toArray(y), Number(degree))
    );
    this.registerFunction("polyreg", (x, y, degree = 2) =>
      istat.polynomialRegression(toArray(x), toArray(y), Number(degree))
    );

    // --- Matrix and Linear Algebra ---
    this.registerFunction("transpose", (data) => istat.transpose(data));
    this.registerFunction("matmul", (a, b) => istat.matmul(a, b));
    this.registerFunction("dot", (a, b) => istat.dot(toArray(a), toArray(b)));
    this.registerFunction("eye", (size) => istat.identity(Number(size)));
    this.registerFunction("diag", (data) => istat.diagonal(data));
    this.registerFunction("trace", (data) => istat.trace(data));
    this.registerFunction("det", (data) => istat.determinant(data));
    this.registerFunction("inv", (data) => istat.inverse(data));
    this.registerFunction("solve", (a, b) => istat.solve(a, b));

    // --- Probability distributions ---
    this.registerFunction("normalPdf", (x, mean = 0, sd = 1) =>
      istat.normalPdf(Number(x), Number(mean), Number(sd))
    );
    this.registerFunction("normalCdf", (x, mean = 0, sd = 1) =>
      istat.normalCdf(Number(x), Number(mean), Number(sd))
    );
    this.registerFunction("binomialPmf", (k, n, p) =>
      istat.binomialPmf(Number(k), Number(n), Number(p))
    );
    this.registerFunction("binomialCdf", (k, n, p) =>
      istat.binomialCdf(Number(k), Number(n), Number(p))
    );
    this.registerFunction("poissonPmf", (k, rate) =>
      istat.poissonPmf(Number(k), Number(rate))
    );
    this.registerFunction("poissonCdf", (k, rate) =>
      istat.poissonCdf(Number(k), Number(rate))
    );
    this.registerFunction("uniformPdf", (x, min = 0, max = 1) =>
      istat.uniformPdf(Number(x), Number(min), Number(max))
    );
    this.registerFunction("uniformCdf", (x, min = 0, max = 1) =>
      istat.uniformCdf(Number(x), Number(min), Number(max))
    );

    // --- istat Sorting ---
    this.registerFunction("sort", (data, asc = true) =>
      istat.numericSort(toArray(data), Boolean(asc))
    );
    this.registerFunction("quickselect", (data, k) =>
      istat.quickselect([...toArray(data)], Number(k))
    );

    // --- Math & Array Utilities ---
    this.registerFunction("sum", (data) => {
      const arr = toArray(data);
      let s = 0;
      for (const x of arr) s += x;
      return s;
    });
    this.registerFunction("min", (data) => Math.min(...toArray(data)));
    this.registerFunction("max", (data) => Math.max(...toArray(data)));
    this.registerFunction("length", (data) =>
      Array.isArray(data) ? data.length : 1
    );
    this.registerFunction("size", (data) => {
      if (!Array.isArray(data)) return [1, 1];
      if (Array.isArray(data[0])) return [data.length, data[0].length];
      return [1, data.length];
    });

    this.registerFunction("zeros", (n: number, m?: number) => {
      const rows = Number(n);
      const cols = m !== undefined ? Number(m) : rows;
      if (m === undefined) {
        return new Array(rows).fill(0);
      }
      return Array.from({ length: rows }, () => new Array(cols).fill(0));
    });

    this.registerFunction("ones", (n: number, m?: number) => {
      const rows = Number(n);
      const cols = m !== undefined ? Number(m) : rows;
      if (m === undefined) {
        return new Array(rows).fill(1);
      }
      return Array.from({ length: rows }, () => new Array(cols).fill(1));
    });

    this.registerFunction("linspace", (start: number, end: number, num = 100) => {
      const n = Math.max(2, Math.round(Number(num)));
      const step = (end - start) / (n - 1);
      const result: number[] = [];
      for (let i = 0; i < n; i++) {
        result.push(start + i * step);
      }
      return result;
    });

    // Vectorizable Math functions
    const unaryMath = (fn: (x: number) => number) => (val: any) => {
      if (Array.isArray(val)) {
        return val.map((x) => (typeof x === "number" ? fn(x) : x));
      }
      return fn(Number(val));
    };

    this.registerFunction("sqrt", unaryMath(Math.sqrt));
    this.registerFunction("abs", unaryMath(Math.abs));
    this.registerFunction("sin", unaryMath(Math.sin));
    this.registerFunction("cos", unaryMath(Math.cos));
    this.registerFunction("tan", unaryMath(Math.tan));
    this.registerFunction("log", unaryMath(Math.log));
    this.registerFunction("log10", unaryMath(Math.log10));
    this.registerFunction("log2", unaryMath(Math.log2));
    this.registerFunction("exp", unaryMath(Math.exp));
    this.registerFunction("round", unaryMath(Math.round));
    this.registerFunction("floor", unaryMath(Math.floor));
    this.registerFunction("ceil", unaryMath(Math.ceil));
    this.registerFunction("mod", (a, b) => ((Number(a) % Number(b)) + Number(b)) % Number(b));
    this.registerFunction("rem", (a, b) => Number(a) % Number(b));

    // --- Visualization & I/O ---
    this.registerFunction("plotHist", (dataOrBins, binsCountOrTitle?: any, title?: string) => {
      const first = Array.isArray(dataOrBins) ? dataOrBins[0] : undefined;
      const isBins = typeof first === "object" && first !== null && "count" in first;
      const chartTitle = typeof binsCountOrTitle === "string" ? binsCountOrTitle : title;
      const numBins = typeof binsCountOrTitle === "number" ? binsCountOrTitle : undefined;

      const bins = isBins
        ? dataOrBins
        : istat.histogram(toArray(dataOrBins), numBins ? { bins: numBins } : {});
      return istat.histogramToSvg(bins, { title: chartTitle });
    });

    this.registerFunction("scatter", (x, y, title?: string) => {
      const ax = toArray(x);
      const ay = toArray(y);
      const points: [number, number][] = ax.map((v, i) => [v, ay[i] ?? 0]);
      return istat.scatterToSvg(points, { title });
    });

    this.registerFunction("saveSvg", (filepath: string, svgContent: string) => {
      fs.writeFileSync(String(filepath), String(svgContent), "utf-8");
      return `Saved SVG to ${filepath}`;
    });

    this.registerFunction("disp", (...args: any[]) => {
      const msg = args.map((a) => formatValue(a)).join(" ");
      console.log(msg);
      return msg;
    });
  }
}

class BreakSignal extends Error {}
class ContinueSignal extends Error {}

function isTruthy(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0 && !Number.isNaN(val);
  if (Array.isArray(val)) return val.length > 0 && val.every((x) => isTruthy(x));
  if (typeof val === "string") return val.length > 0;
  return Boolean(val);
}

function* iterateRange(node: RangeExpression, env: Environment): Generator<number> {
  const start = Number(evalExpr(node.start, env));
  const end = Number(evalExpr(node.end, env));
  const step = node.step
    ? Number(evalExpr(node.step, env))
    : start <= end
      ? 1
      : -1;

  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step)) {
    throw new RangeError("Range bounds and step must be finite numbers");
  }
  if (step === 0) throw new RangeError("Range step cannot be 0");

  const epsilon = Math.abs(step) * 1e-9;
  for (
    let value = start;
    step > 0 ? value <= end + epsilon : value >= end - epsilon;
    value += step
  ) {
    yield Number(value.toFixed(10));
    if (value + step === value) {
      throw new RangeError(`Range step ${step} is too small to advance from ${value}`);
    }
  }
}

function toArray(data: any): number[] {
  if (Array.isArray(data)) {
    return data.map((v) => Number(v));
  }
  if (typeof data === "number") {
    return [data];
  }
  throw new TypeError(`Expected an array of numbers, got ${typeof data}`);
}

export function evaluate(program: Program, env = new Environment()): ExecutionResult {
  let lastValue: any = undefined;
  const outputs: { name?: string; value: any; formatted: string }[] = [];
  let loopDepth = 0;

  for (const stmt of program.body) {
    if (stmt.type !== "FunctionDeclaration") continue;
    env.registerFunction(stmt.name, (...args) => {
      if (args.length !== stmt.parameters.length) {
        throw new TypeError(
          `Function '${stmt.name}' expects ${stmt.parameters.length} argument(s), got ${args.length}`
        );
      }

      const localEnv = env.createChild();
      stmt.parameters.forEach((parameter, index) => {
        localEnv.set(parameter, args[index]);
      });

      try {
        evaluate({ type: "Program", body: stmt.body }, localEnv);
      } catch (error) {
        if (error instanceof BreakSignal) {
          throw new SyntaxError("'break' cannot escape a function");
        }
        if (error instanceof ContinueSignal) {
          throw new SyntaxError("'continue' cannot escape a function");
        }
        throw error;
      }

      if (!localEnv.getVariables().has(stmt.output)) {
        throw new ReferenceError(
          `Function '${stmt.name}' did not assign its output '${stmt.output}'`
        );
      }
      return localEnv.get(stmt.output);
    });
  }

  function executeStatementList(statements: Statement[]): any {
    for (const stmt of statements) {
      if (stmt.type === "FunctionDeclaration") continue;
      lastValue = executeStatement(stmt);
    }
    return lastValue;
  }

  function executeStatement(stmt: Statement): any {
    switch (stmt.type) {
      case "BreakStatement":
        if (loopDepth === 0) throw new SyntaxError("'break' can only be used inside a loop");
        throw new BreakSignal();
      case "ContinueStatement":
        if (loopDepth === 0) throw new SyntaxError("'continue' can only be used inside a loop");
        throw new ContinueSignal();

      case "AssignmentStatement": {
        const val = evalExpr(stmt.value, env);
        env.set(stmt.name, val);
        env.set("ans", val);
        if (!stmt.suppressOutput) {
          outputs.push({
            name: stmt.name,
            value: val,
            formatted: `${stmt.name} =\n${formatValue(val)}`,
          });
        }
        return val;
      }

      case "ExpressionStatement": {
        const val = evalExpr(stmt.expression, env);
        env.set("ans", val);
        if (!stmt.suppressOutput) {
          outputs.push({
            value: val,
            formatted: `ans =\n${formatValue(val)}`,
          });
        }
        return val;
      }

      case "IfStatement": {
        const cond = evalExpr(stmt.test, env);
        if (isTruthy(cond)) {
          return executeStatementList(stmt.consequent);
        } else if (stmt.alternate) {
          return executeStatementList(stmt.alternate);
        }
        return undefined;
      }

      case "ForStatement": {
        const iterable =
          stmt.iterable.type === "RangeExpression"
            ? iterateRange(stmt.iterable, env)
            : evalExpr(stmt.iterable, env);
        let items: Iterable<any>;
        if (typeof iterable === "number") {
          items = [iterable];
        } else if (
          iterable !== null &&
          iterable !== undefined &&
          typeof iterable[Symbol.iterator] === "function"
        ) {
          items = iterable;
        } else {
          throw new TypeError(`Cannot iterate over ${typeof iterable}`);
        }
        let loopVal: any = undefined;
        loopDepth++;
        try {
          for (const item of items) {
            env.set(stmt.variable, item);
            try {
              loopVal = executeStatementList(stmt.body);
            } catch (e) {
              if (e instanceof BreakSignal) {
                break;
              } else if (e instanceof ContinueSignal) {
                continue;
              } else {
                throw e;
              }
            }
          }
        } finally {
          loopDepth--;
        }
        return loopVal;
      }

      case "WhileStatement": {
        let loopVal: any = undefined;
        let iterations = 0;
        const maxIterations = 1_000_000;

        loopDepth++;
        try {
          while (isTruthy(evalExpr(stmt.test, env))) {
            if (++iterations > maxIterations) {
              throw new RangeError("Maximum loop iterations (1,000,000) exceeded");
            }
            try {
              loopVal = executeStatementList(stmt.body);
            } catch (e) {
              if (e instanceof BreakSignal) {
                break;
              } else if (e instanceof ContinueSignal) {
                continue;
              } else {
                throw e;
              }
            }
          }
        } finally {
          loopDepth--;
        }
        return loopVal;
      }

      default:
        throw new Error(`Unknown statement type: ${(stmt as any).type}`);
    }
  }

  executeStatementList(program.body);
  return { lastValue, outputs };
}

function evalExpr(node: Expression, env: Environment): any {
  try {
    return evaluateExpression(node, env);
  } catch (error) {
    if (
      error instanceof Error &&
      node.location &&
      !("sourceLocation" in error)
    ) {
      const { start, text } = node.location;
      const snippet = text.replace(/\s+/g, " ").trim();
      error.message = `${error.message} in expression '${snippet}' (line ${start.line}, column ${start.column})`;
      Object.defineProperty(error, "sourceLocation", {
        value: node.location,
        configurable: true,
      });
    }
    throw error;
  }
}

function evaluateExpression(node: Expression, env: Environment): any {
  switch (node.type) {
    case "NumberLiteral":
      return node.value;
    case "StringLiteral":
      return node.value;
    case "BooleanLiteral":
      return node.value;
    case "Identifier":
      return env.get(node.name);

    case "RangeExpression": {
      return [...iterateRange(node, env)];
    }

    case "ArrayLiteral": {
      const matrix = node.rows.map((row) => row.flatMap((item) => {
        const val = evalExpr(item, env);
        return Array.isArray(val) ? val : [val];
      }));
      return matrix.length === 1 ? matrix[0]! : matrix;
    }

    case "UnaryExpression": {
      const arg = evalExpr(node.argument, env);
      if (node.operator === "-") {
        return Array.isArray(arg) ? arg.map((x) => -x) : -arg;
      }
      if (node.operator === "+") {
        return Array.isArray(arg) ? arg.map((x) => +x) : +arg;
      }
      if (node.operator === "!" || node.operator === "~") {
        return Array.isArray(arg) ? arg.map((x) => (x ? 0 : 1)) : !arg;
      }
      throw new Error(`Unsupported unary operator '${node.operator}'`);
    }

    case "BinaryExpression": {
      const left = evalExpr(node.left, env);
      if (node.operator === "&&" && !Array.isArray(left) && !isTruthy(left)) {
        return 0;
      }
      if (node.operator === "||" && !Array.isArray(left) && isTruthy(left)) {
        return 1;
      }
      const right = evalExpr(node.right, env);
      return applyBinaryOp(node.operator, left, right);
    }

    case "CallExpression": {
      // 1. Method call: obj.method(args)
      if (node.callee.type === "PropertyAccess") {
        const obj = evalExpr(node.callee.object, env);
        if (obj === null || obj === undefined) {
          throw new TypeError(`Cannot call method '${node.callee.property}' of ${obj}`);
        }
        const method = obj[node.callee.property];
        if (typeof method !== "function") {
          throw new TypeError(`'${node.callee.property}' is not a function`);
        }
        const args = node.args.map((a) => evalExpr(a, env));
        return method.apply(obj, args);
      }

      // 2. Direct identifier call: fn(args) or array index: arr(1) / mat(2, 1)
      if (node.callee.type === "Identifier") {
        const target = env.get(node.callee.name);
        if (typeof target === "function") {
          const args = node.args.map((a) => evalExpr(a, env));
          return target(...args);
        }
        if (Array.isArray(target)) {
          if (node.args.length === 1) {
            const idx = Number(evalExpr(node.args[0]!, env));
            validateIndex(idx);
            const val = target[idx - 1];
            if (val === undefined) {
              throw new RangeError(`Index ${idx} out of bounds (valid range: 1-${target.length})`);
            }
            return val;
          }
          if (node.args.length === 2) {
            const r = Number(evalExpr(node.args[0]!, env));
            const c = Number(evalExpr(node.args[1]!, env));
            validateIndex(r);
            validateIndex(c);
            const row = target[r - 1];
            if (!Array.isArray(row)) {
              throw new RangeError(`Row index ${r} out of bounds (valid range: 1-${target.length})`);
            }
            const val = row[c - 1];
            if (val === undefined) {
              throw new RangeError(`Column index ${c} out of bounds (valid range: 1-${row.length})`);
            }
            return val;
          }
        }
        throw new TypeError(`'${node.callee.name}' is not callable`);
      }

      // 3. General expression call
      const fn = evalExpr(node.callee, env);
      if (typeof fn !== "function") {
        throw new TypeError("Expression is not callable");
      }
      const args = node.args.map((a) => evalExpr(a, env));
      return fn(...args);
    }

    case "IndexExpression": {
      const obj = evalExpr(node.object, env);
      if (!Array.isArray(obj)) {
        throw new TypeError("Cannot index a non-array value");
      }
      if (node.index.length === 1) {
        const idx = Number(evalExpr(node.index[0]!, env));
        validateIndex(idx);
        // Language indices are 1-based.
        const val = obj[idx - 1];
        if (val === undefined) {
          throw new RangeError(`Index ${idx} out of bounds (valid range: 1-${obj.length})`);
        }
        return val;
      }
      if (node.index.length === 2) {
        const r = Number(evalExpr(node.index[0]!, env));
        const c = Number(evalExpr(node.index[1]!, env));
        validateIndex(r);
        validateIndex(c);
        const row = obj[r - 1];
        if (!Array.isArray(row)) {
          throw new RangeError(`Row index ${r} out of bounds (valid range: 1-${obj.length})`);
        }
        const val = row[c - 1];
        if (val === undefined) {
          throw new RangeError(`Column index ${c} out of bounds (valid range: 1-${row.length})`);
        }
        return val;
      }
      throw new Error("Multi-dimensional indexing beyond 2D is not supported");
    }

    case "PropertyAccess": {
      const obj = evalExpr(node.object, env);
      if (obj === null || obj === undefined) {
        throw new TypeError(`Cannot read property '${node.property}' of ${obj}`);
      }
      return obj[node.property];
    }

    default:
      throw new Error(`Unknown node type: ${(node as any).type}`);
  }
}

function validateIndex(index: number): void {
  if (!Number.isInteger(index) || index < 1) {
    throw new RangeError(
      `Invalid index ${index}: indices must be positive integers (iStat uses 1-based indexing)`
    );
  }
}

function applyBinaryOp(op: string, left: any, right: any): any {
  const isArrL = Array.isArray(left);
  const isArrR = Array.isArray(right);

  if (op === "*" && isArrL && isArrR) {
    return istat.matmul(left, right);
  }
  if (op === "/" && isArrL && isArrR && isMatrixValue(left) && isMatrixValue(right)) {
    return istat.matmul(left, istat.inverse(right));
  }
  if (op === "^" && isArrL && isMatrixValue(left) && typeof right === "number") {
    return istat.matrixPower(left, right);
  }

  // Vectorized element-wise operations
  if (isArrL && isArrR) {
    if (left.length !== right.length) {
      throw new RangeError(`Vector dimension mismatch: (${left.length}) vs (${right.length})`);
    }
    return left.map((val: any, i: number) => applyBinaryOp(op, val, right[i]));
  }
  if (isArrL && !isArrR) {
    return left.map((val: any) => applyBinaryOp(op, val, right));
  }
  if (!isArrL && isArrR) {
    return right.map((val: any) => applyBinaryOp(op, left, val));
  }

  // Scalar operations
  switch (op) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
    case ".*":
      return left * right;
    case "/":
    case "./":
      return left / right;
    case "%":
      return left % right;
    case "^":
    case ".^":
      return Math.pow(left, right);
    case "==":
      return left === right ? 1 : 0;
    case "!=":
    case "~=":
      return left !== right ? 1 : 0;
    case "<":
      return left < right ? 1 : 0;
    case "<=":
      return left <= right ? 1 : 0;
    case ">":
      return left > right ? 1 : 0;
    case ">=":
      return left >= right ? 1 : 0;
    case "&&":
    case "&":
      return left && right ? 1 : 0;
    case "||":
    case "|":
      return left || right ? 1 : 0;
    default:
      throw new Error(`Unknown binary operator '${op}'`);
  }
}

function isMatrixValue(value: unknown[]): value is number[][] {
  return value.length > 0 && value.every((row) => Array.isArray(row));
}

export function formatValue(val: any, indent = "  "): string {
  if (val === undefined) return "";
  if (val === null) return "null";
  if (typeof val === "number") {
    if (Number.isInteger(val)) return val.toString();
    return Number(val.toFixed(6)).toString();
  }
  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }
  if (typeof val === "string") {
    return val;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    if (Array.isArray(val[0])) {
      // 2D Matrix
      const rows = val.map((row: any[]) =>
        `${indent}[ ${row.map((x: any) => (typeof x === "number" ? Number(x.toFixed(4)).toString() : String(x))).join(", ")} ]`
      );
      return `[\n${rows.join("\n")}\n]`;
    }
    // 1D Vector or list of objects
    const elements = val.map((x) => {
      if (typeof x === "number") return Number(x.toFixed(4)).toString();
      if (typeof x === "object" && x !== null) {
        return `{ ${Object.entries(x).map(([k, v]) => `${k}: ${typeof v === "number" ? Number(v.toFixed(3)).toString() : v}`).join(", ")} }`;
      }
      return String(x);
    });
    if (typeof val[0] === "object" && val[0] !== null) {
      return `[\n${elements.map((e) => `${indent}${e}`).join("\n")}\n]`;
    }
    return `[ ${elements.join(", ")} ]`;
  }
  if (typeof val === "object") {
    const lines = Object.entries(val).map(([k, v]) => `${indent}${k}: ${formatValue(v, indent + "  ")}`);
    return `{\n${lines.join("\n")}\n}`;
  }
  return String(val);
}
