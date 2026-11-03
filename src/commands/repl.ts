import { defineCommand } from "@bunli/core";
import * as readline from "readline";
import { parser } from "../core/parser";
import pc from "picocolors";

export default defineCommand({
  name: "repl",
  description: "Starts the interactive parsing environment",
  handler: () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      // Prompt'u yeşil ve kalın yapalım
      prompt: pc.bold(pc.green("iStat> ")),
    });

    console.log(pc.cyan('✨ iStat REPL started. Type "exit" to quit.\n'));
    rl.prompt();

    rl.on("line", (line) => {
      const input = line.trim();
      if (input === "exit") {
        rl.close();
        return;
      }

      if (input.length > 0) {
        try {
          const result = parser.parse(input);
          console.log(pc.yellow("=>"), pc.bold(pc.green(String(result))));
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
