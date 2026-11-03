import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { evaluate, createEnvironment } from "../core/parser";
import { readFile, writeFile } from "fs/promises";
import { resolve, extname } from "path";
import pc from "picocolors";

export default defineCommand({
  name: "run",
  description: "Reads and executes an .istat or .m script file",
  options: {
    file: option(z.string(), {
      short: "f",
      description: "Path to the script file (e.g. examples/analysis.istat)",
    }),
    svg: option(z.string().optional(), {
      short: "s",
      description: "Save any generated chart SVG to the specified file path",
    }),
  },
  handler: async ({ flags }) => {
    if (!flags.file) {
      console.error(
        pc.red("❌ Please specify a file path. Example: istat run -f examples/analysis.istat")
      );
      process.exit(1);
    }

    const filePath = resolve(process.cwd(), flags.file);
    const ext = extname(filePath);

    if (ext !== ".istat" && ext !== ".m") {
      console.warn(
        pc.yellow(
          `⚠️  Warning: File extension is '${ext}', expecting '.istat' or '.m'. Proceeding anyway.`
        )
      );
    }

    try {
      const fileContent = await readFile(filePath, "utf-8");

      if (fileContent.trim().length === 0) {
        console.warn(pc.yellow("⚠️  The script file is empty."));
        return;
      }

      console.log(`\n${pc.cyan(pc.bold("📄 Running Script:"))} ${pc.gray(flags.file)}\n`);

      const env = createEnvironment();
      const result = evaluate(fileContent, env);

      // Print unsuppressed outputs
      for (const out of result.outputs) {
        console.log(pc.yellow(out.formatted));
      }

      // If --svg flag is passed and lastValue contains SVG
      if (flags.svg && typeof result.lastValue === "string" && result.lastValue.includes("<svg")) {
        await writeFile(flags.svg, result.lastValue, "utf-8");
        console.log(`\n${pc.green(`✅ Chart SVG saved to ${pc.bold(flags.svg)}`)}`);
      }

      console.log(pc.green(pc.bold("\n✨ Script finished successfully.\n")));
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.error(
          `\n${pc.bold(pc.red("❌ Error:"))} File not found -> ${pc.gray(filePath)}`
        );
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
