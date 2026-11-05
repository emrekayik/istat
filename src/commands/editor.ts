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
    let server: ReturnType<typeof Bun.serve>;

    try {
      server = Bun.serve({
        hostname: "127.0.0.1",
        port: flags.port,
        maxRequestBodySize: 100_000,
        fetch: handleEditorRequest,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        pc.red(`❌ Could not start iStat Studio on 127.0.0.1:${flags.port}: ${message}`)
      );
      process.exit(1);
    }

    console.log(`\n${pc.bold(pc.magenta("iStat Studio"))}`);
    console.log(`Open ${pc.cyan(server.url.href)} in your browser.`);
    console.log(pc.gray("Local-only editor. Press Ctrl+C to stop.\n"));
  },
});
