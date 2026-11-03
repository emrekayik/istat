import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import pc from "picocolors";
import { handleEditorRequest } from "../editor/server";

export default defineCommand({
  name: "editor",
  description: "Opens the iStat documentation and interactive code editor",
  options: {
    port: option(z.coerce.number().int().min(0).max(65535).default(4173), {
      short: "p",
      description: "Local web server port (0 selects an available port)",
    }),
  },
  handler: ({ flags }) => {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: flags.port,
      maxRequestBodySize: 100_000,
      fetch: handleEditorRequest,
    });

    console.log(`\n${pc.bold(pc.magenta("iStat Studio"))}`);
    console.log(`Open ${pc.cyan(server.url.href)} in your browser.`);
    console.log(pc.gray("Local-only editor. Press Ctrl+C to stop.\n"));
  },
});
