import { createCLI } from "@bunli/core";
import evalCommand from "./commands/eval";
import replCommand from "./commands/repl";

const cli = await createCLI({
  name: "istat",
  version: "0.1.0",
  description: "iStat CLI tool",
});

cli.command(evalCommand);
cli.command(replCommand);

await cli.run();
