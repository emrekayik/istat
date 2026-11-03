import { createCLI } from "@bunli/core";
import evalCommand from "./commands/eval";
import replCommand from "./commands/repl";
import runCommand from "./commands/run";

const cli = await createCLI({
  name: "istat",
  version: "0.1.0",
  description: "iStat CLI tool",
});

cli.command(evalCommand);
cli.command(replCommand);
cli.command(runCommand);

await cli.run();
