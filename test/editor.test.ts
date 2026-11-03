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
});
