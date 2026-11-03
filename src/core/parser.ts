import * as peggy from "peggy";
import { readFileSync } from "fs";
import type { Program } from "./ast";
import { Environment, evaluate as evaluateAst, type ExecutionResult } from "./evaluator";

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

/**
 * Parses source code written in the MATLAB/Octave-like iStat language into an AST.
 */
export function parse(input: string): Program {
  return parser.parse(input) as Program;
}

/**
 * Evaluates iStat code directly using the given or a new persistent Environment.
 */
export function evaluate(input: string, env?: Environment): ExecutionResult {
  const ast = parse(input);
  return evaluateAst(ast, env);
}

/**
 * Creates a fresh iStat runtime Environment.
 */
export function createEnvironment(): Environment {
  return new Environment();
}

export { Environment, formatValue } from "./evaluator";
export type { ExecutionResult } from "./evaluator";
export * from "./ast";
