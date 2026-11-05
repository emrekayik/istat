import { describe, expect, test } from "bun:test";
import { PassThrough, Writable } from "node:stream";
import { createReplInterface } from "../src/commands/repl";

describe("iStat terminal REPL", () => {
  test("uses readline history when stdin is a TTY even if output is not", async () => {
    const input = new PassThrough() as PassThrough & { isTTY: boolean };
    input.isTTY = true;
    const output = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    const rl = createReplInterface(input, output);
    const lines: string[] = [];

    const completed = new Promise<string[]>((resolve) => {
      rl.on("line", (line) => {
        lines.push(line);
        if (lines.length === 2) {
          rl.close();
          resolve(lines);
        }
      });
    });

    rl.prompt();
    input.write("x = 1\n");
    input.write("\u001b[A\n");

    expect(await completed).toEqual(["x = 1", "x = 1"]);
  });
});
