import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { evaluate, createEnvironment } from "../core/parser";
import { readFile, writeFile } from "fs/promises";
import { resolve, extname } from "path";
import pc from "picocolors";
import { isSvg } from "./svg";

export default defineCommand({
  name: "run",
  description: "Reads and executes an .istat or .m script file",
  options: {
    file: option(z.string().optional(), {
      short: "f",
      description: "Path to the script file (e.g. examples/analysis.istat)",
    }),
    svg: option(z.string().optional(), {
      short: "s",
      description: "Save any generated chart SVG to the specified file path",
    }),
  },
  handler: async ({ flags, positional }) => {
    const file = flags.file ?? positional[0];
    if (!file) {
      console.error(
        pc.red(
          "❌ Please specify a file path. Example: istat run examples/analysis.istat"
        )
      );
      process.exit(1);
    }

    const filePath = resolve(process.cwd(), file);
    const ext = extname(filePath).toLowerCase();

    if (ext !== ".istat" && ext !== ".m") {
      console.warn(
        pc.yellow(
          `⚠️  Warning: File extension is '${ext}', expecting '.istat' or '.m'. Proceeding anyway.`
        )
      );
    }

    let scriptLoaded = false;

    try {
      const fileContent = await readFile(filePath, "utf-8");
      scriptLoaded = true;

      if (fileContent.trim().length === 0) {
        console.warn(pc.yellow("⚠️  The script file is empty."));
        return;
      }

      console.log(`\n${pc.cyan(pc.bold("📄 Running Script:"))} ${pc.gray(file)}\n`);

      const env = createEnvironment();
      const result = evaluate(fileContent, env);
      const svg = isSvg(result.lastValue) ? result.lastValue : undefined;
      const svgPath = flags.svg && svg ? flags.svg : undefined;

      if (flags.svg && !svg) {
        console.warn(
          pc.yellow(
            "⚠️  --svg was provided, but the last result is not SVG markup; no file was written."
          )
        );
      }

      // Print unsuppressed outputs, omitting the chart markup that was saved to disk.
      const outputs = svgPath
        ? result.outputs.filter((out) => !isSvg(out.value))
        : result.outputs;
      for (const [index, out] of outputs.entries()) {
        if (index > 0) console.log("");
        console.log(pc.yellow(out.formatted));
      }

      if (svgPath && svg) {
        try {
          await writeFile(svgPath, svg, "utf-8");
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(
            `\n${pc.bold(pc.red("❌ Error:"))} Could not write SVG to ${pc.gray(svgPath)}: ${message}`
          );
          process.exit(1);
        }
        console.log(`\n${pc.green(`✅ Chart SVG saved to ${pc.bold(svgPath)}`)}`);
      }

      console.log(pc.green(pc.bold("\n✨ Script finished successfully.\n")));
    } catch (error: any) {
      if (!scriptLoaded && error.code === "ENOENT") {
        console.error(
          `\n${pc.bold(pc.red("❌ Error:"))} File not found -> ${pc.gray(filePath)}`
        );
      } else if (error.code) {
        console.error(`\n${pc.bold(pc.red("❌ File Error:"))} ${pc.red(error.message)}`);
      } else if (error.message?.includes("Expected") || error.location) {
        console.error(`\n${pc.bold(pc.red("❌ Syntax Error in script:"))}`);
        console.error(pc.red(error.message));
      } else {
        console.error(
          `\n${pc.bold(pc.red("❌ Runtime Error:"))}`,
          error.message
        );
      }
      process.exit(1);
    }
  },
});
