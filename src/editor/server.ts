import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { createEnvironment, evaluate, formatValue } from "../core/parser";
import { editorExamples } from "./examples";

const publicDirectory = join(import.meta.dir, "public");
const docsDirectories = [
  join(import.meta.dir, "../../docs"),
  join(import.meta.dir, "docs"),
];
const docsDirectory =
  docsDirectories.find((directory) => existsSync(join(directory, "language.md"))) ??
  docsDirectories[0]!;
const aceDirectory = dirname(
  fileURLToPath(import.meta.resolve("ace-builds/src-noconflict/ace.js"))
);

const documents = {
  language: { title: "Language reference", file: "language.md" },
  library: { title: "TypeScript library", file: "library.md" },
  cli: { title: "CLI guide", file: "cli.md" },
} as const;

const aceAssets = {
  "ace.js": "application/javascript; charset=utf-8",
  "mode-matlab.js": "application/javascript; charset=utf-8",
  "theme-tomorrow_night.js": "application/javascript; charset=utf-8",
} as const;

const baseHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
};

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: baseHeaders });
}

export async function handleEditorRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname)) {
    return jsonResponse({ error: "Editor is only available on localhost" }, 403);
  }

  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) {
      return jsonResponse({ error: "Cross-origin requests are not allowed" }, 403);
    }
  }

  if (request.method === "GET" && url.pathname === "/") {
    return staticFile(join(publicDirectory, "index.html"), "text/html; charset=utf-8");
  }
  if (request.method === "GET" && url.pathname === "/app.js") {
    return staticFile(join(publicDirectory, "app.js"), "application/javascript; charset=utf-8");
  }
  if (request.method === "GET" && url.pathname === "/styles.css") {
    return staticFile(join(publicDirectory, "styles.css"), "text/css; charset=utf-8");
  }

  if (request.method === "GET" && url.pathname.startsWith("/assets/")) {
    const assetName = url.pathname.slice("/assets/".length);
    if (Object.hasOwn(aceAssets, assetName)) {
      const contentType = aceAssets[assetName as keyof typeof aceAssets];
      return staticFile(join(aceDirectory, assetName), contentType);
    }
    return jsonResponse({ error: "Asset not found" }, 404);
  }

  if (request.method === "GET" && url.pathname === "/api/docs") {
    return jsonResponse(
      Object.entries(documents).map(([id, document]) => ({
        id,
        title: document.title,
      }))
    );
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/docs/")) {
    const id = url.pathname.slice("/api/docs/".length) as keyof typeof documents;
    const document = documents[id];
    if (!document) return jsonResponse({ error: "Document not found" }, 404);
    const markdown = await Bun.file(join(docsDirectory, document.file)).text();
    return jsonResponse({
      id,
      title: document.title,
      html: await marked.parse(markdown),
    });
  }

  if (request.method === "GET" && url.pathname === "/api/examples") {
    return jsonResponse(editorExamples);
  }

  if (request.method === "POST" && url.pathname === "/api/evaluate") {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 100_000) {
      return jsonResponse({ error: "Code exceeds the 100 KB limit" }, 413);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON" }, 400);
    }
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("code" in payload) ||
      typeof payload.code !== "string"
    ) {
      return jsonResponse({ error: "Request must include a string 'code' field" }, 400);
    }
    if (payload.code.length > 100_000) {
      return jsonResponse({ error: "Code exceeds the 100 KB limit" }, 413);
    }

    try {
      const result = evaluate(payload.code, createEnvironment());
      return jsonResponse({
        outputs: result.outputs.map((output) => output.formatted),
        result: formatValue(result.lastValue),
      });
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      const sourceLocation =
        "sourceLocation" in failure ? failure.sourceLocation : undefined;
      const parserLocation =
        "location" in failure ? failure.location : undefined;
      return jsonResponse(
        {
          error: failure.message,
          location: sourceLocation ?? parserLocation,
        },
        400
      );
    }
  }

  return jsonResponse({ error: "Not found" }, 404);
}

function staticFile(path: string, contentType: string): Response {
  return new Response(Bun.file(path), {
    headers: {
      ...baseHeaders,
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    },
  });
}
