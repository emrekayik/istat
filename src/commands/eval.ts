import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { parser } from "../core/parser";
import pc from "picocolors";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  gray: "\x1b[90m",
};

export default defineCommand({
  name: "eval",
  description:
    "It parses the entered expression in your own language and returns the result",
  options: {
    input: option(z.string(), {
      short: "i",
      description: 'Expression to be processed (e.g., "2 + 3")',
    }),
  },
  handler: ({ flags }) => {
    if (!flags.input) {
      console.error(
        pc.red("❌ Please enter some text. Example: istat eval -i '2 + 3'"),
      );
      process.exit(1);
    }

    try {
      const result = parser.parse(String(flags.input));

      console.log(
        `\n${colors.cyan}${colors.bold}✅ Input:${colors.reset} ${colors.gray}${flags.input}${colors.reset}`,
      );
      console.log(
        `${colors.green}${colors.bold}🔍 Result:${colors.reset} ${colors.yellow}${colors.bold}${result}${colors.reset}`,
      );
    } catch (error: any) {
      console.error(
        `\n${colors.red}${colors.bold}❌ Parsing Error:${colors.reset}`,
      );
      console.error(`${colors.red}${error.message}${colors.reset}`);
      process.exit(1);
    }
  },
});
