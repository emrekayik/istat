import { createCLI } from "@bunli/core";
import evalCommand from "./commands/eval";
import editorCommand from "./commands/editor";
import replCommand from "./commands/repl";
import runCommand from "./commands/run";

const cli = await createCLI({
  name: "istat",
  version: "0.1.0",
  description: "iStat CLI tool",
});

cli.command(evalCommand);
cli.command(editorCommand);
cli.command(replCommand);
cli.command(runCommand);

const argv = process.argv.slice(2);
const first = argv[0];
const isScriptPath =
  first !== undefined && !first.startsWith("-") && /\.(istat|m)$/i.test(first);
const isFileFlag = first === "-f" || first === "--file";

if (argv.length === 0) {
  // A bare `istat` invocation should drop straight into the interactive REPL
  // so users can start typing without knowing the subcommand.
  await cli.run(["repl"]);
} else if (isScriptPath || isFileFlag) {
  await cli.run(["run", ...argv]);
} else {
  await cli.run();
}
