import { defineCommand } from "@bunli/core";
import * as readline from "readline";
import { evaluate, createEnvironment } from "../core/parser";
import pc from "picocolors";

export function createReplInterface(
  input: NodeJS.ReadableStream & { readonly isTTY?: boolean } = process.stdin,
  output: NodeJS.WritableStream = process.stdout
): readline.Interface {
  return readline.createInterface({
    input,
    output,
    prompt: `${pc.bold(pc.cyan("istat"))} ${pc.magenta("❯")} `,
    historySize: 1000,
    removeHistoryDuplicates: true,
    terminal: input.isTTY === true,
  });
}

export default defineCommand({
  name: "repl",
  description: "Starts the interactive statistical language iStat REPL environment",
  handler: async () => {
    const env = createEnvironment();
    if (process.stdin.isTTY && process.stdout.isTTY) {
      const { startReplTui } = await import("./repl-tui");
      await startReplTui(env);
      return;
    }

    const rl = createReplInterface();

    printBanner();
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
  const heading = (title: string) => console.log(`\n${pc.bold(pc.cyan(`◆ ${title}`))}`);

  console.log(`\n${pc.bold(pc.magenta("  iStat field guide"))} ${pc.dim("· quick reference")}`);
  heading("Session");
  console.log(`  ${pc.green("who")} / ${pc.green("whos")} / ${pc.green("vars")}  ${pc.dim("List variables")}`);
  console.log(`  ${pc.green("clear")}                 ${pc.dim("Clear session variables")}`);
  console.log(`  ${pc.green("help")} / ${pc.green("?")}            ${pc.dim("Show this guide")}`);
  console.log(`  ${pc.green("exit")} / ${pc.green("quit")}         ${pc.dim("Leave iStat")}`);

  heading("Language");
  console.log(`  ${pc.yellow("x = 1:2:9")}              ${pc.dim("Create a range")}`);
  console.log(`  ${pc.yellow("A = [1 2; 3 4]")}        ${pc.dim("Create a matrix")}`);
  console.log(`  ${pc.yellow("A * B")}  ${pc.dim("matrix product")}   ${pc.yellow("A .* B")}  ${pc.dim("element-wise")}`);
  console.log(`  ${pc.yellow("function y = f(x)")}     ${pc.dim("Define a reusable function")}`);
  console.log(`  ${pc.yellow("x = 10;")}                ${pc.dim("Semicolon hides output")}`);

  heading("Math & analysis");
  console.log(`  ${pc.yellow("Stats")}     mean, median, std, var, quantile, summary, mode, zscore`);
  console.log(`  ${pc.yellow("Models")}    corr, spearman, linreg, polyfit`);
  console.log(`  ${pc.yellow("Matrices")}  transpose, matmul, dot, det, inv, solve`);
  console.log(`  ${pc.yellow("Chance")}    normalCdf, binomialPmf, poissonPmf, uniformCdf`);
  console.log(`  ${pc.yellow("Plots")}     plotHist, scatter, saveSvg`);
  console.log(`\n${pc.dim("Tip: ↑/↓ browses command history. Try")} ${pc.cyan("summary([2, 4, 4, 8])")}${pc.dim(".")}\n`);
}

function printBanner(): void {
  const border = pc.cyan("  ╭──────────────────────────────────────────────────────╮");
  console.log(`\n${border}`);
  console.log(`  ${pc.cyan("│")}  ${pc.bold(pc.magenta("iStat"))} ${pc.dim("·")} ${pc.bold("Interactive Statistics Lab")}                 ${pc.cyan("│")}`);
  console.log(`  ${pc.cyan("│")}  ${pc.dim("Explore data. Calculate boldly. Stay curious.")}       ${pc.cyan("│")}`);
  console.log(`  ${pc.cyan("├──────────────────────────────────────────────────────┤")}`);
  console.log(`  ${pc.cyan("│")}  ${pc.green("↑/↓")} history   ${pc.yellow("help")} guide   ${pc.red("exit")} quit                 ${pc.cyan("│")}`);
  console.log(`  ${pc.cyan("╰──────────────────────────────────────────────────────╯")}\n`);
}
