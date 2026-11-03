import * as peggy from "peggy";
import { readFileSync } from "fs";

const grammarUrl = new URL("../grammar.peggy", import.meta.url);
const grammarPath = grammarUrl.pathname;

let grammarContent: string;
try {
  grammarContent = readFileSync(grammarPath, "utf-8");
} catch (error) {
  console.error("The grammar file could not be read:", grammarPath);
  process.exit(1);
}

export const parser = peggy.generate(grammarContent);
