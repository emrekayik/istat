import {
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
  createCliRenderer,
} from "@opentui/core";
import type { Environment } from "../core/evaluator";
import { evaluate } from "../core/parser";

const colors = {
  background: "#111827",
  panel: "#172033",
  border: "#334155",
  text: "#e2e8f0",
  muted: "#94a3b8",
  accent: "#67e8f9",
  prompt: "#a78bfa",
  result: "#facc15",
  error: "#fb7185",
};

export async function startReplTui(env: Environment): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useMouse: false,
    backgroundColor: colors.background,
  });

  const closed = new Promise<void>((resolve) => {
    renderer.once("destroy", resolve);
  });

  const screen = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    gap: 1,
    padding: 1,
    backgroundColor: colors.background,
  });
  const header = new BoxRenderable(renderer, {
    width: "100%",
    height: 3,
    paddingX: 1,
    border: true,
    borderStyle: "rounded",
    borderColor: colors.border,
    backgroundColor: colors.panel,
    flexShrink: 0,
  });
  header.add(
    new TextRenderable(renderer, {
      content: "iStat  ·  Interactive Statistics Lab",
      fg: colors.accent,
    })
  );

  const transcript = new ScrollBoxRenderable(renderer, {
    width: "100%",
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 0,
    border: true,
    borderStyle: "rounded",
    borderColor: colors.border,
    title: " Session ",
    stickyScroll: true,
    stickyStart: "bottom",
    contentOptions: {
      flexDirection: "column",
      padding: 1,
    },
  });

  const inputRow = new BoxRenderable(renderer, {
    width: "100%",
    height: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingX: 1,
    border: true,
    borderStyle: "rounded",
    borderColor: colors.accent,
    backgroundColor: colors.panel,
    flexShrink: 0,
  });
  inputRow.add(
    new TextRenderable(renderer, {
      content: "❯",
      fg: colors.prompt,
      flexShrink: 0,
    })
  );
  const input = new InputRenderable(renderer, {
    id: "istat-repl-input",
    width: "100%",
    flexGrow: 1,
    placeholder: "Type an expression or `help`…",
    textColor: colors.text,
    focusedBackgroundColor: colors.panel,
    cursorColor: colors.accent,
  });
  inputRow.add(input);

  const footer = new TextRenderable(renderer, {
    width: "100%",
    height: 1,
    content: "↑/↓ history   PgUp/PgDn scroll   vars inspect   clear reset   help guide   Ctrl+C exit",
    fg: colors.muted,
    flexShrink: 0,
  });

  screen.add(header);
  screen.add(transcript);
  screen.add(inputRow);
  screen.add(footer);
  renderer.root.add(screen);
  input.focus();

  const history: string[] = [];
  let historyIndex = 0;
  let draft = "";

  const append = (content: string, fg = colors.text) => {
    transcript.add(new TextRenderable(renderer, { content, fg, width: "100%" }));
    transcript.scrollTo(Infinity);
  };

  append("Explore data. Calculate boldly. Stay curious.", colors.muted);
  append("Enter `help` for commands and examples.", colors.muted);

  const onKeyPress = (key: { name: string; ctrl: boolean; preventDefault(): void }) => {
    if (key.name === "up" && history.length > 0) {
      key.preventDefault();
      if (historyIndex === history.length) draft = input.value;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] ?? "";
      return;
    }
    if (key.name === "down" && historyIndex < history.length) {
      key.preventDefault();
      historyIndex += 1;
      input.value = historyIndex === history.length ? draft : (history[historyIndex] ?? "");
      return;
    }
    if (key.name === "pageup") {
      key.preventDefault();
      transcript.scrollBy(-1, "viewport");
    } else if (key.name === "pagedown") {
      key.preventDefault();
      transcript.scrollBy(1, "viewport");
    }
  };
  renderer.keyInput.on("keypress", onKeyPress);
  renderer.once("destroy", () => renderer.keyInput.off("keypress", onKeyPress));

  input.on(InputRenderableEvents.ENTER, (value) => {
    const source = value.trim();
    input.value = "";
    historyIndex = history.length;
    draft = "";
    if (source.length === 0) return;

    history.push(source);
    append(`❯ ${source}`, colors.accent);
    if (source === "exit" || source === "quit") {
      renderer.destroy();
      return;
    }
    if (source === "clear") {
      env.clearVariables();
      append("All session variables cleared.", colors.muted);
      return;
    }
    if (source === "who" || source === "whos" || source === "vars") {
      const variables = env.getVariables();
      if (variables.size === 0) {
        append("No variables defined.", colors.muted);
      } else {
        for (const [name, value] of variables) {
          const type = Array.isArray(value) ? `array [${value.length}]` : typeof value;
          append(`${name.padEnd(12)} : ${type} = ${formatSummary(value)}`);
        }
      }
      return;
    }
    if (source === "help" || source === "?") {
      for (const line of helpLines) append(line, colors.muted);
      return;
    }

    try {
      const result = evaluate(source, env);
      for (const output of result.outputs) append(output.formatted, colors.result);
    } catch (error) {
      append(`Error: ${error instanceof Error ? error.message : String(error)}`, colors.error);
    }
  });

  try {
    await closed;
  } finally {
    renderer.destroy();
  }
}

function formatSummary(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length <= 6) return `[ ${value.join(", ")} ]`;
    return `[ ${value.slice(0, 3).join(", ")}, ..., ${value.slice(-2).join(", ")} ]`;
  }
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

const helpLines = [
  "Session: who / whos / vars · clear · exit / quit",
  "Language: x = 1:2:9 · A = [1 2; 3 4] · A .* B · function y = f(x)",
  "Stats: mean, median, std, var, quantile, summary, mode, zscore",
  "Models: corr, spearman, linreg, polyfit",
  "Matrices: transpose, matmul, dot, det, inv, solve",
  "Chance: normalCdf, binomialPmf, poissonPmf, uniformCdf",
  "Plots: plotHist, scatter, saveSvg",
  "Example: summary([2, 4, 4, 8])",
];
