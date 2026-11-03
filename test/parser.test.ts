import { describe, expect, it } from "bun:test";
import { evaluate, createEnvironment } from "../src/core/parser";

describe("iStat Language - Parser & Evaluator (MATLAB/Octave Syntax)", () => {
  it("evaluates basic arithmetic and variables", () => {
    const env = createEnvironment();
    const result = evaluate("a = 10; b = 20; c = a + b * 2", env);
    expect(env.get("a")).toBe(10);
    expect(env.get("b")).toBe(20);
    expect(env.get("c")).toBe(50);
    expect(result.lastValue).toBe(50);
  });

  it("evaluates ranges (start:stop and start:step:stop)", () => {
    const env = createEnvironment();
    evaluate("r1 = 1:5; r2 = 1:2:9; r3 = 5:-1:1;", env);
    expect(env.get("r1")).toEqual([1, 2, 3, 4, 5]);
    expect(env.get("r2")).toEqual([1, 3, 5, 7, 9]);
    expect(env.get("r3")).toEqual([5, 4, 3, 2, 1]);
  });

  it("evaluates 2D matrices and indexing", () => {
    const env = createEnvironment();
    evaluate("A = [1 2; 3 4]; val = A(2, 1);", env);
    expect(env.get("A")).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(env.get("val")).toBe(3); // MATLAB 1-based indexing
  });

  it("reports source positions and expressions for parse and indexing errors", () => {
    expect(() => evaluate("value = 1;\nif value >\nend")).toThrow(
      /line 2, column \d+\)\nif value >\n\s*\^/
    );

    expect(() => evaluate("values = [10, 20];\nanswer = values(3);")).toThrow(
      /Index 3 out of bounds \(valid range: 1-2\) in expression 'values\(3\)' \(line 2, column 10\)/
    );
    expect(() => evaluate("values = [10, 20]; values(1.5);")).toThrow(
      /Invalid index 1\.5: indices must be positive integers.*expression 'values\(1\.5\)'/
    );
    expect(() => evaluate("if missing > 0\nend")).toThrow(
      /Undefined variable or function 'missing' in expression 'missing > 0' \(line 1, column 4\)/
    );
  });

  it("performs vectorized element-wise operations", () => {
    const env = createEnvironment();
    evaluate("x = [1, 2, 3]; y = x .* 2 + 10;", env);
    expect(env.get("y")).toEqual([12, 14, 16]);

    evaluate("v1 = [1, 2, 3]; v2 = [4, 5, 6]; v3 = v1 + v2;", env);
    expect(env.get("v3")).toEqual([5, 7, 9]);
  });

  it("supports matrix products and linear algebra built-ins", () => {
    const env = createEnvironment();
    evaluate(
      `
        A = [1 2; 3 4];
        B = [5 6; 7 8];
        product = A * B;
        elementwise = A .* B;
        vectorProduct = [1, 2, 3] * [4, 5, 6];
        solution = solve([3 1; 1 2], [9, 8]);
        inverseA = inv(A);
        determinantA = det(A);
      `,
      env
    );

    expect(env.get("product")).toEqual([[19, 22], [43, 50]]);
    expect(env.get("elementwise")).toEqual([[5, 12], [21, 32]]);
    expect(env.get("vectorProduct")).toBe(32);
    expect(env.get("solution")).toEqual([2, 3]);
    expect(env.get("determinantA")).toBe(-2);
    expect(env.get("inverseA")[0][0]).toBeCloseTo(-2);
  });

  it("provides probability and descriptive-statistics built-ins", () => {
    const env = createEnvironment();
    evaluate(
      `
        probability = binomialPmf(2, 5, 0.5);
        cumulative = normalCdf(0);
        eventRate = poissonPmf(2, 3);
        mostCommon = mode([1, 2, 2, 3, 3]);
        standardized = zscore([1, 2, 3]);
      `,
      env
    );

    expect(env.get("probability")).toBeCloseTo(0.3125);
    expect(env.get("cumulative")).toBeCloseTo(0.5, 7);
    expect(env.get("eventRate")).toBeCloseTo(0.2240418077, 9);
    expect(env.get("mostCommon")).toEqual([2, 3]);
    expect(env.get("standardized")[1]).toBe(0);
  });

  it("executes descriptive statistics from src/istat", () => {
    const env = createEnvironment();
    const code = `
      x = [2, 4, 4, 4, 5, 5, 7, 9];
      m = mean(x);
      med = median(x);
      s = std(x);
      v = var(x);
      q = quantile(x, 0.5);
    `;
    evaluate(code, env);
    expect(env.get("m")).toBe(5);
    expect(env.get("med")).toBe(4.5);
    expect(env.get("s")).toBeCloseTo(2.138, 3);
    expect(env.get("v")).toBeCloseTo(4.5714, 3);
    expect(env.get("q")).toBe(4.5);
  });

  it("executes correlation and regression from src/istat", () => {
    const env = createEnvironment();
    const code = `
      x = 1:5;
      y = 2 * x + 3;
      r = corr(x, y);
      model = linreg(x, y);
      pred = model.predict(6);
    `;
    evaluate(code, env);
    expect(env.get("r")).toBeCloseTo(1, 6);
    expect(env.get("model").slope).toBeCloseTo(2, 6);
    expect(env.get("model").intercept).toBeCloseTo(3, 6);
    expect(env.get("pred")).toBeCloseTo(15, 6);
  });

  it("reads data files from language scripts and analyzes columns", () => {
    const env = createEnvironment();
    evaluate(
      `
        rows = readData("examples/measurements.csv");
        scores = column(rows, "score");
        average = mean(scores);
      `,
      env
    );

    expect(env.get("rows")).toHaveLength(4);
    expect(env.get("scores")).toEqual([12.5, 16.2, 14.8, 19.1]);
    expect(env.get("average")).toBeCloseTo(15.65);
  });

  it("benchmarks user-defined functions and measures elapsed time", () => {
    const env = createEnvironment();
    evaluate(
      `
        started = tic();
        result = benchmark(workload, 3, 0);
        elapsed = toc(started);
        function output = workload()
          output = mean(1:100);
        end
      `,
      env
    );

    expect(env.get("result").iterations).toBe(3);
    expect(env.get("result").meanMs).toBeGreaterThanOrEqual(0);
    expect(env.get("result").opsPerSecond).toBeGreaterThan(0);
    expect(env.get("elapsed")).toBeGreaterThanOrEqual(0);
  });

  it("handles comments and semicolon output suppression", () => {
    const env = createEnvironment();
    const code = `
      % This is a MATLAB comment
      x = 10; % Semicolon suppresses output
      y = 20  % No semicolon, output should be captured
      # Python-style comment
      // C-style comment
    `;
    const res = evaluate(code, env);
    expect(env.get("x")).toBe(10);
    expect(env.get("y")).toBe(20);
    expect(res.outputs.length).toBe(1);
    expect(res.outputs[0]?.name).toBe("y");
  });

  it("evaluates if, elseif, and else branches", () => {
    const env = createEnvironment();
    evaluate(
      `
        x = 2;
        if x == 1
          result = 1;
        elseif x == 2
          result = 2;
        else
          result = 3;
        end
      `,
      env
    );

    expect(env.get("result")).toBe(2);
  });

  it("short-circuits logical conditions", () => {
    const env = createEnvironment();
    evaluate(
      `
        if false && missing > 0
          result = 1;
        else
          result = 2;
        end
        if true || anotherMissing > 0
          result = result + 1;
        end
      `,
      env
    );

    expect(env.get("result")).toBe(3);
  });

  it("supports for and while loops with break and continue", () => {
    const env = createEnvironment();
    evaluate(
      `
        total = 0;
        for i = 1:6
          if i == 2
            continue;
          end
          if i == 5
            break;
          end
          total = total + i;
        end
        count = 0;
        while count < 3
          count = count + 1;
        end
      `,
      env
    );

    expect(env.get("total")).toBe(8);
    expect(env.get("count")).toBe(3);
  });

  it("keeps break local to the innermost loop and iterates huge ranges lazily", () => {
    const env = createEnvironment();
    evaluate(
      `
        total = 0;
        for outer = 1:3
          for inner = 1:1000000000000
            total = total + outer * 10 + inner;
            break;
          end
          total = total + 1;
        end
        for value = 1:1000000000000
          firstValues = [value];
          if value == 3
            break;
          end
        end
      `,
      env
    );

    expect(env.get("total")).toBe(66);
    expect(env.get("firstValues")).toEqual([3]);
  });

  it("keeps function variables and loop variables local to each call", () => {
    const env = createEnvironment();
    evaluate(
      `
        value = 10;
        result = isolated(3);
        function output = isolated(value)
          value = value + 1;
          for localIndex = 1:2
            output = value + localIndex;
          end
        end
      `,
      env
    );

    expect(env.get("value")).toBe(10);
    expect(env.get("result")).toBe(6);
    expect(env.has("localIndex")).toBe(false);
  });

  it("rejects break and continue outside loops with clear errors", () => {
    expect(() => evaluate("break")).toThrow("'break' can only be used inside a loop");
    expect(() => evaluate("continue")).toThrow(
      "'continue' can only be used inside a loop"
    );
  });

  it("defines functions with local variables and calls them before declaration", () => {
    const env = createEnvironment();
    evaluate(
      `
        base = 100;
        result = offset_mean(5);
        function output = offset_mean(value)
          temporary = value + 1;
          output = mean([temporary, temporary + 2]);
        end
      `,
      env
    );

    expect(env.get("result")).toBe(7);
    expect(env.has("temporary")).toBe(false);
  });

  it("supports recursive user-defined functions", () => {
    const env = createEnvironment();
    evaluate(
      `
        answer = factorial(5);
        function result = factorial(n)
          if n <= 1
            result = 1;
          else
            result = n * factorial(n - 1);
          end
        end
      `,
      env
    );

    expect(env.get("answer")).toBe(120);
  });

  it("reports invalid function calls and missing outputs", () => {
    const env = createEnvironment();
    evaluate(
      `
        function result = identity(value)
          result = value;
        end
        function result = missing_output()
          temporary = 1;
        end
      `,
      env
    );

    expect(() => evaluate("identity()", env)).toThrow(
      "Function 'identity' expects 1 argument(s), got 0"
    );
    expect(() => evaluate("missing_output()", env)).toThrow(
      "Function 'missing_output' did not assign its output 'result'"
    );
  });

  it("does not expose script variables inside function scope", () => {
    const env = createEnvironment();
    evaluate(
      `
        secret = 42;
        function result = read_secret()
          result = secret;
        end
      `,
      env
    );

    expect(() => evaluate("read_secret()", env)).toThrow(
      "Undefined variable or function 'secret'"
    );
  });

  it("generates SVG visualizations through built-in plot functions", () => {
    const env = createEnvironment();
    const code = `
      data = [1, 2, 2, 3, 3, 3, 4, 5];
      svg = plotHist(data, 4, "Hist Title");
    `;
    evaluate(code, env);
    const svg = env.get("svg");
    expect(svg).toContain("<svg");
    expect(svg).toContain("Hist Title");
  });
});
