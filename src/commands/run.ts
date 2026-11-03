import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { parser } from "../core/parser";
import { readFile } from "fs/promises";
import { resolve, extname } from "path";
import pc from "picocolors";

export default defineCommand({
  name: "run",
  description: "Reads and executes an .istat file",
  options: {
    file: option(z.string(), {
      short: "f",
      description: "The path to the file to be run (e.g., examples/test.istat)",
    }),
  },
  handler: async ({ flags }) => {
    if (!flags.file) {
      console.error(
        pc.red(
          "❌ Please specify a file path. Example: istat run -f examples/test.istat",
        ),
      );
      process.exit(1);
    }

    const filePath = resolve(process.cwd(), flags.file);

    if (extname(filePath) !== ".istat") {
      console.warn(
        pc.yellow(
          "⚠️  Warning: The file extension isn't .istat, but I'll try to open it anyway.",
        ),
      );
    }

    try {
      const fileContent = await readFile(filePath, "utf-8");

      if (fileContent.trim().length === 0) {
        console.warn(pc.yellow("⚠️  The file is empty."));
        return;
      }

      const result = parser.parse(fileContent);

      console.log(`\n${pc.cyan("📄 File:")} ${pc.gray(flags.file)}`);
      // console.log(`${pc.cyan("📝 Content:")} ${pc.gray(fileContent.trim())}`);
      console.log(
        `${pc.bold(pc.green("🔍 Result:"))} ${pc.bold(pc.yellow(String(result)))}\n`,
      );
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.error(
          `\n${pc.bold(pc.red("❌ Error:"))} File not found -> ${pc.gray(filePath)}`,
        );
      } else if (error.message.includes("Expected")) {
        console.error(`\n${pc.bold(pc.red("❌ syntax error:"))}`);
        console.error(pc.red(error.message));
        console.error(pc.gray(`File: ${flags.file}`));
      } else {
        console.error(
          `\n${pc.bold(pc.red("❌ Unexpected Error:"))}`,
          error.message,
        );
      }
      process.exit(1);
    }
  },
});
