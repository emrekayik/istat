import { describe, expect, it } from "bun:test";
import { editorExamples, type EditorExample } from "../src/editor/examples";
import { handleEditorRequest } from "../src/editor/server";

describe("iStat Studio", () => {
  it("serves the editor, local Ace assets, and project documentation", async () => {
    const page = await handleEditorRequest(new Request("http://127.0.0.1/"));
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("iStat Studio");

    const ace = await handleEditorRequest(
      new Request("http://127.0.0.1/assets/ace.js")
    );
    expect(ace.status).toBe(200);
    expect(ace.headers.get("content-type")).toContain("javascript");

    const app = await handleEditorRequest(
      new Request("http://127.0.0.1/app.js")
    );
    const appSource = await app.text();
    expect(appSource).toContain("for (const docEntry of documents)");
    expect(appSource).toContain('fetch("/api/repl"');

    const docs = await handleEditorRequest(
      new Request("http://127.0.0.1/api/docs/language")
    );
    const content = (await docs.json()) as { title: string; html: string };
    expect(content.title).toBe("Language reference");
    expect(content.html).toContain("Control flow");
  });

  it("provides runnable examples covering the interpreter feature groups", async () => {
    const response = await handleEditorRequest(
      new Request("http://127.0.0.1/api/examples")
    );
    const examples = (await response.json()) as EditorExample[];
    expect(examples).toHaveLength(editorExamples.length);
    expect(examples.map((example: { category: string }) => example.category)).toContain(
      "Matrices"
    );

    for (const example of editorExamples) {
      const result = await handleEditorRequest(
        new Request("http://127.0.0.1/api/evaluate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: example.code }),
        })
      );
      expect(result.status).toBe(200);
    }
  });

  it("returns useful evaluation errors and rejects cross-origin requests", async () => {
    const error = await handleEditorRequest(
      new Request("http://127.0.0.1/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "data = [1, 2]; data(3);" }),
      })
    );
    expect(error.status).toBe(400);
    expect(((await error.json()) as { error: string }).error).toContain("data(3)");

    const crossOrigin = await handleEditorRequest(
      new Request("http://127.0.0.1/api/evaluate", {
        method: "POST",
        headers: {
          origin: "http://example.com",
          "content-type": "application/json",
        },
        body: JSON.stringify({ code: "mean([1, 2])" }),
      })
    );
    expect(crossOrigin.status).toBe(403);
  });

  it("returns all assigned variables for the Studio output panel", async () => {
    const response = await handleEditorRequest(
      new Request("http://127.0.0.1/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: "data = [2, 4, 6]; average = mean(data);",
        }),
      })
    );
    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      variables: { name: string; formatted: string }[];
    };
    expect(result.variables).toEqual([
      { name: "data", formatted: "[ 2, 4, 6 ]" },
      { name: "average", formatted: "4" },
    ]);
  });

  it("keeps REPL variables between commands and isolates sessions", async () => {
    const evaluateRepl = (sessionId: string, code: string) =>
      handleEditorRequest(
        new Request("http://127.0.0.1/api/repl", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, sessionId }),
        })
      );

    const assigned = await evaluateRepl("repl-session-a", "x = 2");
    expect(assigned.status).toBe(200);
    const result = await evaluateRepl("repl-session-a", "x + 3");
    expect(((await result.json()) as { outputs: string[] }).outputs).toEqual([
      "ans =\n5",
    ]);

    const isolated = await evaluateRepl("repl-session-b", "x + 3");
    expect(isolated.status).toBe(400);

    const cleared = await evaluateRepl("repl-session-a", "clear");
    expect(((await cleared.json()) as { outputs: string[] }).outputs).toEqual([
      "All session variables cleared.",
    ]);
    expect((await evaluateRepl("repl-session-a", "x")).status).toBe(400);
  });
});
