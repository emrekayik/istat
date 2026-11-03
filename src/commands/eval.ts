import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { evaluate, createEnvironment, formatValue } from "../core/parser";
import { writeFileSync } from "fs";
import pc from "picocolors";

export default defineCommand({
  name: "eval",
  description: "Evaluates an expression or multi-statement MATLAB-style code and prints the result",
  options: {
    input: option(z.string(), {
      short: "i",
      description: 'Expression or code to execute (e.g. "x = 1:5; mean(x)")',
    }),
    json: option(z.boolean().optional(), {
      short: "j",
      description: "Output the result as formatted JSON",
    }),
    svg: option(z.string().optional(), {
      short: "s",
      description: "Save SVG output to the specified file path",
    }),
  },
  handler: ({ flags }) => {
    if (!flags.input) {
      console.error(
        pc.red("❌ Please enter code to evaluate. Example: istat eval -i 'x = 1:5; mean(x)'")
      );
      process.exit(1);
    }

    try {
      const env = createEnvironment();
      const result = evaluate(String(flags.input), env);

      // If --svg flag is given and lastValue is SVG
      if (flags.svg && typeof result.lastValue === "string" && result.lastValue.includes("<svg")) {
        writeFileSync(flags.svg, result.lastValue, "utf-8");
        console.log(pc.green(`✅ Chart SVG saved to ${pc.bold(flags.svg)}`));
      }

      const isJson =
        flags.json === true ||
        String(flags.json) === "true" ||
        process.argv.includes("--json") ||
        process.argv.includes("-j");

      if (isJson) {
        console.log(
          JSON.stringify(
            {
              input: flags.input,
              result: result.lastValue,
              variables: Object.fromEntries(env.getVariables()),
            },
            null,
            2
          )
        );
        return;
      }

      console.log(`\n${pc.cyan(pc.bold("📥 Input:"))} ${pc.gray(flags.input)}`);
      if (result.outputs.length > 0) {
        for (const out of result.outputs) {
          console.log(pc.yellow(out.formatted));
        }
      } else {
        console.log(
          `${pc.green(pc.bold("🔍 Result:"))} ${pc.yellow(pc.bold(formatValue(result.lastValue)))}\n`
        );
      }
    } catch (error: any) {
      console.error(`\n${pc.bold(pc.red("❌ Execution Error:"))}`);
      console.error(pc.red(error.message));
      process.exit(1);
    }
  },
});
