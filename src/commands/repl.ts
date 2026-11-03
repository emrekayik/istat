import { defineCommand } from "@bunli/core";
import * as readline from "readline";
import { evaluate, createEnvironment } from "../core/parser";
import pc from "picocolors";

export default defineCommand({
  name: "repl",
  description: "Starts the interactive MATLAB/Octave-like iStat REPL environment",
  handler: () => {
    const env = createEnvironment();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: pc.bold(pc.green("iStat> ")),
    });

    console.log(
      pc.bold(pc.cyan("✨ iStat Interactive Statistics Environment (MATLAB/Octave Syntax)"))
    );
    console.log(
      pc.gray('Type "help" for a list of functions, "whos" to see variables, or "exit" to quit.\n')
    );
    rl.prompt();

    rl.on("line", (line) => {
      const input = line.trim();

      if (input === "exit" || input === "quit") {
        rl.close();
        return;
      }

      if (input === "clear") {
        env.clearVariables();
        console.log(pc.gray("All session variables cleared."));
        rl.prompt();
        return;
      }

      if (input === "who" || input === "whos" || input === "vars") {
        const vars = env.getVariables();
        if (vars.size === 0) {
          console.log(pc.gray("No variables defined."));
        } else {
          console.log(pc.bold(pc.cyan("Variables in current session:")));
          for (const [name, val] of vars) {
            const type = Array.isArray(val)
              ? `array [${val.length}]`
              : typeof val;
            console.log(`  ${pc.yellow(name.padEnd(12))} : ${pc.gray(type)} = ${formatSummary(val)}`);
          }
        }
        rl.prompt();
        return;
      }

      if (input === "help" || input === "?") {
        printHelp();
        rl.prompt();
        return;
      }

      if (input.length > 0) {
        try {
          const result = evaluate(input, env);
          for (const out of result.outputs) {
            console.log(pc.yellow(out.formatted));
          }
        } catch (error: any) {
          console.error(pc.red("Error:"), pc.red(error.message));
        }
      }

      rl.prompt();
    }).on("close", () => {
      console.log(pc.gray("\nSee you later! 👋"));
      process.exit(0);
    });
  },
});

function formatSummary(val: any): string {
  if (Array.isArray(val)) {
    if (val.length <= 6) {
      return `[ ${val.join(", ")} ]`;
    }
    return `[ ${val.slice(0, 3).join(", ")}, ..., ${val.slice(-2).join(", ")} ]`;
  }
  if (typeof val === "object" && val !== null) {
    return JSON.stringify(val);
  }
  return String(val);
}

function printHelp(): void {
  console.log(pc.bold(pc.cyan("\n📖 iStat Commands & Syntax Guide:")));
  console.log(`
  ${pc.bold("Commands:")}
    ${pc.green("whos / who")}     List all variables currently defined
    ${pc.green("clear")}          Clear all user variables
    ${pc.green("help")}           Show this help message
    ${pc.green("exit / quit")}    Quit the REPL

  ${pc.bold("Syntax & Arrays:")}
    x = [1, 2, 3, 4, 5]     Define vector
    x = 1:2:9               Range (start:step:stop) -> [1, 3, 5, 7, 9]
    A = [1 2; 3 4]          2D Matrix
    x(1) or x[1]            1-based indexing (x(1) = first element)
    x = 10;                 Trailing semicolon suppresses output

  ${pc.bold("Statistics Functions (istat):")}
    ${pc.yellow("Descriptive:")}  mean(x), median(x), std(x), var(x), quantile(x, 0.5), summary(x)
    ${pc.yellow("Correlation:")}  corr(x, y), cov(x, y), spearman(x, y)
    ${pc.yellow("Regression:")}   linreg(x, y), polyfit(x, y, degree)
    ${pc.yellow("Charts:")}       plotHist(x, bins, title), scatter(x, y, title), saveSvg(path, svg)
    ${pc.yellow("Math:")}         sum(x), min(x), max(x), length(x), zeros(n), ones(n), sqrt(x), abs(x)
`);
}
