import { describe, expect, it } from "bun:test";
import { evaluate, createEnvironment } from "./parser";

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

  it("performs vectorized element-wise operations", () => {
    const env = createEnvironment();
    evaluate("x = [1, 2, 3]; y = x .* 2 + 10;", env);
    expect(env.get("y")).toEqual([12, 14, 16]);

    evaluate("v1 = [1, 2, 3]; v2 = [4, 5, 6]; v3 = v1 + v2;", env);
    expect(env.get("v3")).toEqual([5, 7, 9]);
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

