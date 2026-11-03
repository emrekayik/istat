import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const output = join(root, "dist");

mkdirSync(output, { recursive: true });
cpSync(join(root, "src/grammar.peggy"), join(output, "grammar.peggy"));
cpSync(join(root, "src/editor/public"), join(output, "public"), { recursive: true });
cpSync(join(root, "docs"), join(output, "docs"), { recursive: true });
