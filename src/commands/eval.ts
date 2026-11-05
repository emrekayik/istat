import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { evaluate, createEnvironment, formatValue } from "../core/parser";
import { writeFileSync } from "fs";
import pc from "picocolors";
import { isSvg } from "./svg";

export default defineCommand({
  name: "eval",
  description: "Evaluates iStat expressions and scripts and prints the result",
  options: {
    input: option(z.string().optional(), {
      short: "i",
      description: 'Expression or code to execute (e.g. "x = 1:5; mean(x)")',
    }),
    json: option(z.boolean().optional(), {
      short: "j",
      description: "Output the result as formatted JSON",
      argumentKind: "flag",
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
      const result = evaluate(flags.input, env);
      const isJson = flags.json === true;
      const svg = isSvg(result.lastValue) ? result.lastValue : undefined;
      const svgPath = flags.svg && svg ? flags.svg : undefined;

      if (flags.svg && !svg) {
        console.warn(
          pc.yellow(
            "⚠️  --svg was provided, but the last result is not SVG markup; no file was written."
          )
        );
      }

      if (svgPath && svg) {
        try {
          writeFileSync(svgPath, svg, "utf-8");
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(pc.red(`❌ Could not write SVG to ${pc.bold(svgPath)}: ${message}`));
          process.exit(1);
        }
        if (isJson) {
          console.error(pc.green(`✅ Chart SVG saved to ${pc.bold(svgPath)}`));
        }
      }

      if (isJson) {
        console.log(
          JSON.stringify(
            {
              input: flags.input,
              result: result.lastValue,
              ...(svgPath ? { svg: svgPath } : {}),
              variables: Object.fromEntries(env.getVariables()),
            },
            null,
            2
          )
        );
        return;
      }

      console.log(`\n${pc.cyan(pc.bold("📥 Input:"))} ${pc.gray(flags.input)}`);
      const outputs = svgPath
        ? result.outputs.filter((out) => !isSvg(out.value))
        : result.outputs;
      if (outputs.length > 0) {
        for (const out of outputs) {
          console.log(pc.yellow(out.formatted));
        }
      } else if (!svgPath) {
        console.log(
          `${pc.green(pc.bold("🔍 Result:"))} ${pc.yellow(pc.bold(formatValue(result.lastValue)))}\n`
        );
      }

      if (svgPath) {
        console.log(pc.green(`✅ Chart SVG saved to ${pc.bold(svgPath)}`));
      }
    } catch (error: any) {
      const heading = error.code
        ? "❌ File Error:"
        : error.location
          ? "❌ Syntax Error:"
          : "❌ Execution Error:";
      console.error(`\n${pc.bold(pc.red(heading))}`);
      console.error(pc.red(error.message));
      process.exit(1);
    }
  },
});
