import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const extension = require("../vscode-extension/extension.cjs") as {
  activate: (context: { subscriptions: unknown[] }) => void;
  createCompletionProvider: (vscode: Record<string, any>) => {
    provideCompletionItems: (
      document: {
        lineAt: (line: number) => { text: string };
        getWordRangeAtPosition: (position: unknown) => unknown;
        getText: () => string;
      },
      position: { line: number; character: number }
    ) => { label: string; insertText?: { value: string } }[];
  };
  findUserSymbols: (text: string) => string[];
};

describe("VS Code iStat extension", () => {
  it("declares the .istat language and valid highlighting and snippet files", () => {
    const manifest = JSON.parse(
      readFileSync("vscode-extension/package.json", "utf8")
    );
    const grammar = JSON.parse(
      readFileSync("vscode-extension/syntaxes/istat.tmLanguage.json", "utf8")
    );
    const snippets = JSON.parse(
      readFileSync("vscode-extension/snippets/istat.json", "utf8")
    );

    expect(manifest.contributes.languages[0].extensions).toEqual([".istat"]);
    expect(grammar.scopeName).toBe("source.istat");
    expect(JSON.stringify(grammar)).toContain("string.quoted.single.istat");
    expect(snippets["Function definition"].body[0]).toContain("function");
  });

  it("suggests built-ins, language keywords, and symbols from the document", () => {
    class CompletionItem {
      label: string;
      constructor(label: string) {
        this.label = label;
      }
    }

    const vscodeStub = {
      CompletionItem,
      CompletionItemKind: { Function: 1, Keyword: 2, Variable: 3 },
      MarkdownString: class {
        constructor(_value: string) {}
      },
      Range: class {
        constructor(_start: unknown, _end: unknown) {}
      },
      SnippetString: class {
        value: string;
        constructor(value: string) {
          this.value = value;
        }
      },
    };
    const provider = extension.createCompletionProvider(vscodeStub);
    const text = "values = [1, 2];\nfunction result = center(data)\n";
    const line = "";
    const suggestions = provider.provideCompletionItems(
      {
        lineAt: () => ({ text: line }),
        getWordRangeAtPosition: () => undefined,
        getText: () => text,
      },
      { line: 0, character: line.length }
    );
    const labels = suggestions.map((item) => item.label);
    expect(labels).toContain("mean");
    expect(labels).toContain("values");
    expect(labels).toContain("center");
    expect(labels).toContain("data");
    expect(suggestions.find((item) => item.label === "mean")?.insertText?.value).toBe(
      "mean($0)"
    );
    expect(extension.findUserSymbols("x = 1 % y = 2").includes("y")).toBe(false);
  });
});
