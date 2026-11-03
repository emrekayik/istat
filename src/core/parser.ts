import * as peggy from "peggy";
import { readFileSync } from "fs";

const grammarUrl = new URL("../grammar.peggy", import.meta.url);
const grammarPath = grammarUrl.pathname;

let grammarContent: string;
try {
  grammarContent = readFileSync(grammarPath, "utf-8");
} catch (error) {
  console.error("Gramer dosyası okunamadı:", grammarPath);
  process.exit(1);
}

export const parser = peggy.generate(grammarContent);
