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
  try {
    return parser.parse(input) as Program;
  } catch (error) {
    if (
      error instanceof Error &&
      "location" in error &&
      error.location &&
      typeof error.location === "object"
    ) {
      const location = error.location as {
        start?: { line?: number; column?: number };
      };
      const { line, column } = location.start ?? {};
      if (line !== undefined && column !== undefined) {
        const sourceLine = input.split(/\r?\n/)[line - 1] ?? "";
        const caret = `${" ".repeat(Math.max(column - 1, 0))}^`;
        error.message = `${error.message} (line ${line}, column ${column})\n${sourceLine}\n${caret}`;
      }
    }
    throw error;
  }
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
