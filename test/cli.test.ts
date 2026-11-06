import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const tempDir = mkdtempSync(join(tmpdir(), "istat-cli-"));
const sampleScriptPath = join(tempDir, "sample.istat");
writeFileSync(sampleScriptPath, "(10 + 5) * 2 - 8\n");

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

async function runCli(args: string[], stdin?: string) {
  const proc = Bun.spawn([process.execPath, "src/index.ts", ...args], {
    cwd: root,
    env: { ...process.env, NO_COLOR: "1" },
    stdin: stdin === undefined ? "ignore" : "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (stdin !== undefined) {
    proc.stdin!.write(stdin);
    proc.stdin!.end();
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout, stderr, exitCode };
}

describe("iStat CLI", () => {
  test("evaluates code and prints the result", async () => {
    const { stdout, stderr, exitCode } = await runCli([
      "eval",
      "-i",
      "x = 1:5; mean(x)",
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("Input:");
    expect(stdout).toContain("3");
  });

  test("prints machine-readable JSON results", async () => {
    const { stdout, stderr, exitCode } = await runCli([
      "eval",
      "-i",
      "mean([1, 2, 3])",
      "-j",
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    const payload = JSON.parse(stdout) as {
      result: number;
      variables: Record<string, number>;
    };
    expect(payload.result).toBe(2);
    expect(payload.variables.ans).toBe(2);
  });

  test("saves SVG output without echoing the markup", async () => {
    const svgPath = join(tempDir, "histogram.svg");
    const { stdout, exitCode } = await runCli([
      "eval",
      "-i",
      'plotHist([1, 2, 2, 3], 4, "Counts")',
      "--svg",
      svgPath,
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Chart SVG saved");
    expect(stdout).not.toContain("<svg");
    expect(readFileSync(svgPath, "utf-8")).toContain("<svg");
  });

  test("keeps JSON stdout valid when saving SVG output", async () => {
    const svgPath = join(tempDir, "json-histogram.svg");
    const { stdout, stderr, exitCode } = await runCli([
      "eval",
      "-i",
      'plotHist([1, 2, 2, 3], 4, "Counts")',
      "--json",
      "--svg",
      svgPath,
    ]);

    expect(exitCode).toBe(0);
    const payload = JSON.parse(stdout) as { result: string; svg: string };
    expect(payload.svg).toBe(svgPath);
    expect(payload.result).toContain("<svg");
    expect(stderr).toContain("Chart SVG saved");
  });

  test("warns instead of writing when --svg receives a non-SVG result", async () => {
    const svgPath = join(tempDir, "not-svg.svg");
    const { stdout, stderr, exitCode } = await runCli([
      "eval",
      "-i",
      "mean([1, 2, 3])",
      "--svg",
      svgPath,
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("not SVG");
    expect(existsSync(svgPath)).toBe(false);
    expect(stdout).toContain("2");
  });

  test("runs a script file", async () => {
    const { stdout, stderr, exitCode } = await runCli([
      "run",
      "-f",
      sampleScriptPath,
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("22");
    expect(stdout).toContain("Script finished successfully");
  });

  test("runs a script file passed positionally", async () => {
    const { stdout, stderr, exitCode } = await runCli([
      "run",
      sampleScriptPath,
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain(`Running Script: ${sampleScriptPath}`);
    expect(stdout).toContain("22");
    expect(stdout).toContain("Script finished successfully");
  });

  test("dispatches a script path directly to the run command", async () => {
    const { stdout, stderr, exitCode } = await runCli([sampleScriptPath]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain(`Running Script: ${sampleScriptPath}`);
    expect(stdout).toContain("22");
    expect(stdout).toContain("Script finished successfully");
  });

  test("dispatches a leading file flag to the run command", async () => {
    const { stdout, stderr, exitCode } = await runCli([
      "-f",
      sampleScriptPath,
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain(`Running Script: ${sampleScriptPath}`);
    expect(stdout).toContain("22");
  });

  test("separates script results with blank lines", async () => {
    const scriptPath = join(tempDir, "blocks.istat");
    writeFileSync(scriptPath, "a = 1\nb = 2\n");

    const { stdout, exitCode } = await runCli(["run", scriptPath]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("a =\n1\n\nb =\n2");
  });

  test("warns about unexpected script extensions but still runs the file", async () => {
    const scriptPath = join(tempDir, "script.txt");
    writeFileSync(scriptPath, "1 + 1\n");

    const { stdout, stderr, exitCode } = await runCli(["run", "-f", scriptPath]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("expecting '.istat' or '.m'");
    expect(stdout).toContain("2");
  });

  test("accepts .m and uppercase script extensions", async () => {
    const matlabPath = join(tempDir, "SCRIPT.m");
    writeFileSync(matlabPath, "mean([2, 4, 6])\n");

    const matlab = await runCli(["run", "-f", matlabPath]);
    expect(matlab.exitCode).toBe(0);
    expect(matlab.stderr).toBe("");
    expect(matlab.stdout).toContain("4");

    const upperPath = join(tempDir, "SCRIPT.ISTAT");
    writeFileSync(upperPath, "2 + 2\n");

    const upper = await runCli(["run", "-f", upperPath]);
    expect(upper.exitCode).toBe(0);
    expect(upper.stderr).toBe("");
    expect(upper.stdout).toContain("4");
  });

  test("saves script SVG output without echoing the markup", async () => {
    const scriptPath = join(tempDir, "chart.istat");
    const svgPath = join(tempDir, "script-histogram.svg");
    writeFileSync(scriptPath, 'x = [1, 2, 2, 3];\nplotHist(x, 4, "Counts");\n');

    const { stdout, stderr, exitCode } = await runCli([
      "run",
      "-f",
      scriptPath,
      "--svg",
      svgPath,
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).not.toContain("<svg");
    expect(stdout).toContain("Chart SVG saved");
    expect(readFileSync(svgPath, "utf-8")).toContain("<svg");
  });

  test("saves line and bar SVG output", async () => {
    const scriptPath = join(tempDir, "line-bar.istat");
    const svgPath = join(tempDir, "line-chart.svg");

    writeFileSync(
      scriptPath,
      'plotLine([1, 2, 3], [3, 1, 4], "Trend");\n'
    );
    const line = await runCli(["run", scriptPath, "--svg", svgPath]);
    expect(line.exitCode).toBe(0);
    expect(line.stdout).toContain("Chart SVG saved");
    expect(readFileSync(svgPath, "utf-8")).toContain("<polyline");

    writeFileSync(
      scriptPath,
      'bar(["A", "B", "C"], [4, 7, 2], "Counts");\n'
    );
    const bar = await runCli(["run", scriptPath, "--svg", svgPath]);
    expect(bar.exitCode).toBe(0);
    expect(bar.stdout).toContain("Chart SVG saved");
    expect(readFileSync(svgPath, "utf-8")).toContain("<rect");
  });

  test("writes data files from scripts", async () => {
    const scriptPath = join(tempDir, "write-data.istat");
    const csvPath = join(tempDir, "written.csv");
    const jsonPath = join(tempDir, "written.json");

    writeFileSync(
      scriptPath,
      `writeData(${JSON.stringify(csvPath)}, [1, 2, 3])\n` +
        `writeData(${JSON.stringify(jsonPath)}, ["Ada", 9])\n`
    );

    const { stdout, stderr, exitCode } = await runCli(["run", scriptPath]);
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("Saved CSV");
    expect(stdout).toContain("Saved JSON");
    expect(readFileSync(csvPath, "utf-8")).toBe("value\n1\n2\n3\n");
    expect(JSON.parse(readFileSync(jsonPath, "utf-8"))).toEqual(["Ada", 9]);
  });

  test("reports SVG write failures without blaming the script path", async () => {
    const svgPath = join(tempDir, "missing-dir", "histogram.svg");
    const evalResult = await runCli([
      "eval",
      "-i",
      'plotHist([1, 2, 2, 3], 4, "Counts")',
      "--svg",
      svgPath,
    ]);
    expect(evalResult.exitCode).toBe(1);
    expect(evalResult.stderr).toContain("Could not write SVG");

    const scriptPath = join(tempDir, "write-error.istat");
    writeFileSync(scriptPath, 'plotHist([1, 2, 2, 3], 4, "Counts");\n');
    const runResult = await runCli(["run", "-f", scriptPath, "--svg", svgPath]);
    expect(runResult.exitCode).toBe(1);
    expect(runResult.stderr).toContain("Could not write SVG");
    expect(runResult.stderr).not.toContain(`File not found -> ${scriptPath}`);
  });

  test("reports missing input and files with non-zero exits", async () => {
    const evalResult = await runCli(["eval"]);
    expect(evalResult.exitCode).toBe(1);
    expect(evalResult.stderr).toContain("Please enter code to evaluate");

    const runResult = await runCli(["run"]);
    expect(runResult.exitCode).toBe(1);
    expect(runResult.stderr).toContain("Please specify a file path");

    const missing = await runCli(["run", "-f", join(tempDir, "missing.istat")]);
    expect(missing.exitCode).toBe(1);
    expect(missing.stderr).toContain("File not found");
  });

  test("reports syntax and execution errors with non-zero exits", async () => {
    const syntax = await runCli(["eval", "-i", "1 +"]);
    expect(syntax.exitCode).toBe(1);
    expect(syntax.stderr).toContain("Syntax Error");

    const runtime = await runCli(["eval", "-i", "unknownFn(2)"]);
    expect(runtime.exitCode).toBe(1);
    expect(runtime.stderr).toContain("Execution Error");
  });

  test("starts the REPL when no command is given", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      [],
      "x = 2\nx + 3\nexit\n",
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("istat ❯");
    expect(stdout).toContain("See you later");
    expect(stdout).not.toContain("Commands:");
    expect(stdout).toContain("5");
  });

  test("keeps variables between piped REPL commands", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      ["repl"],
      "x = 2\nvars\nmean([1, 2, 3])\nclear\nvars\nexit\n"
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("Variables in current session");
    expect(stdout).toContain("number = 2");
    expect(stdout).toContain("All session variables cleared");
    expect(stdout).toContain("No variables defined");
    expect(stdout).toContain("See you later");
  });

  test("reports an editor port conflict", async () => {
    const blocker = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () => new Response("blocked"),
    });

    try {
      const { stderr, exitCode } = await runCli([
        "editor",
        "-p",
        String(blocker.port),
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain("Could not start iStat Studio");
    } finally {
      blocker.stop(true);
    }
  });

  test("renders built-in help and version in the requested format", async () => {
    const help = await runCli(["--help", "--format", "toon"]);

    expect(help.exitCode).toBe(0);
    expect(help.stdout).toContain("istat v0.1.0");
    expect(help.stdout).toContain("eval");
    expect(help.stdout).toContain("run");

    const version = await runCli(["--version", "--format", "toon"]);
    expect(version.exitCode).toBe(0);
    expect(version.stdout.trim()).toBe("istat v0.1.0");
  });
});
