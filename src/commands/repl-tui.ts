import {
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  StyledText,
  TextRenderable,
  bold,
  createCliRenderer,
  fg,
  type TextChunk,
} from "@opentui/core";
import type { ChartInfo } from "../core/charts";
import type { Environment } from "../core/evaluator";
import { evaluate } from "../core/parser";
import {
  chartTitle,
  renderChartRows,
  type ChartRow,
  type ChartTone,
} from "./chart";
import { isSvg } from "./svg";

const colors = {
  background: "#111827",
  panel: "#172033",
  border: "#334155",
  borderActive: "#0e7490",
  text: "#e2e8f0",
  muted: "#94a3b8",
  accent: "#67e8f9",
  prompt: "#a78bfa",
  result: "#facc15",
  error: "#fb7185",
  success: "#4ade80",
  bar: "#22d3ee",
  point: "#fbbf24",
  axis: "#475569",
};

const chartToneColors: Record<ChartTone, string> = {
  title: colors.accent,
  axis: colors.axis,
  bar: colors.bar,
  point: colors.point,
  label: colors.muted,
  muted: colors.border,
};

const MAX_TRANSCRIPT_LINES = 400;

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
    backgroundColor: colors.background,
  });

  const header = new BoxRenderable(renderer, {
    width: "100%",
    height: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingX: 1,
    backgroundColor: colors.panel,
    flexShrink: 0,
  });
  const headerLeft = new TextRenderable(renderer, {
    content: "",
    flexShrink: 1,
    wrapMode: "none",
  });
  const headerRight = new TextRenderable(renderer, {
    content: "",
    flexShrink: 0,
    wrapMode: "none",
  });
  header.add(headerLeft);
  header.add(headerRight);

  const body = new BoxRenderable(renderer, {
    width: "100%",
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 0,
    flexDirection: "row",
    gap: 1,
    paddingX: 1,
    marginTop: 1,
    marginBottom: 1,
    backgroundColor: colors.background,
  });

  const transcript = new ScrollBoxRenderable(renderer, {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 0,
    border: true,
    borderStyle: "rounded",
    borderColor: colors.border,
    title: " Session ",
    titleAlignment: "left",
    stickyScroll: true,
    stickyStart: "bottom",
    contentOptions: {
      flexDirection: "column",
      padding: 1,
      gap: 0,
    },
  });

  const sidebar = new BoxRenderable(renderer, {
    width: 32,
    flexShrink: 0,
    minHeight: 0,
    flexDirection: "column",
    gap: 1,
    backgroundColor: colors.background,
  });

  const variablesPanel = new ScrollBoxRenderable(renderer, {
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 4,
    border: true,
    borderStyle: "rounded",
    borderColor: colors.border,
    title: " Variables ",
    titleAlignment: "left",
    stickyScroll: true,
    stickyStart: "top",
    contentOptions: {
      flexDirection: "column",
      paddingX: 1,
      paddingY: 0,
    },
  });
  const variablesText = new TextRenderable(renderer, {
    width: "100%",
    content: "",
    fg: colors.text,
    wrapMode: "word",
  });
  variablesPanel.add(variablesText);

  const chartPanel = new BoxRenderable(renderer, {
    width: "100%",
    height: 8,
    flexShrink: 0,
    border: true,
    borderStyle: "rounded",
    borderColor: colors.borderActive,
    title: " Chart ",
    titleAlignment: "left",
    paddingX: 1,
    overflow: "hidden",
    visible: false,
  });
  const chartText = new TextRenderable(renderer, {
    width: "100%",
    height: "100%",
    content: "",
    fg: colors.text,
    wrapMode: "none",
    overflow: "hidden",
  });
  chartPanel.add(chartText);

  sidebar.add(variablesPanel);
  sidebar.add(chartPanel);

  const inputRow = new BoxRenderable(renderer, {
    width: "auto",
    height: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingX: 1,
    marginX: 1,
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

  const footer = new BoxRenderable(renderer, {
    width: "100%",
    height: 1,
    flexShrink: 0,
    paddingX: 1,
    backgroundColor: colors.panel,
  });
  const footerText = new TextRenderable(renderer, {
    width: "100%",
    content: "",
    fg: colors.muted,
    wrapMode: "none",
  });
  footer.add(footerText);

  body.add(transcript);
  body.add(sidebar);
  screen.add(header);
  screen.add(body);
  screen.add(inputRow);
  screen.add(footer);
  renderer.root.add(screen);
  input.focus();

  const history: string[] = [];
  const lineIds: string[] = [];
  let lineCounter = 0;
  let historyIndex = 0;
  let draft = "";
  let commandCount = 0;
  let variableCount = 0;
  let chartCount = 0;
  let activeChart: ChartInfo | undefined;
  let chartVisible = false;
  let sidebarVisible = true;
  let sidebarWidth = 32;
  let chartHeight = 8;

  const styled = (...chunks: TextChunk[]): StyledText => new StyledText(chunks);

  const append = (content: string | StyledText, color = colors.text) => {
    const id = `istat-line-${lineCounter++}`;
    const value = typeof content === "string" ? styled(fg(color)(content)) : content;
    transcript.add(
      new TextRenderable(renderer, {
        id,
        content: value,
        fg: colors.text,
        width: "100%",
        wrapMode: "word",
      })
    );
    lineIds.push(id);
    while (lineIds.length > MAX_TRANSCRIPT_LINES) {
      const oldest = lineIds.shift();
      if (oldest) transcript.remove(oldest);
    }
    transcript.scrollTo(Infinity);
  };

  const clearTranscript = () => {
    for (const id of lineIds) transcript.remove(id);
    lineIds.length = 0;
  };

  const updateHeader = () => {
    const compact = renderer.width < 76;
    headerLeft.content = styled(
      bold(fg(colors.accent)("◆ ")),
      bold(fg(colors.text)("iStat")),
      fg(colors.muted)(compact ? "  REPL" : "  ·  Interactive Statistics Lab")
    );
    headerRight.content = styled(
      fg(colors.muted)("vars "),
      fg(colors.accent)(String(variableCount)),
      fg(colors.border)("  ·  "),
      fg(colors.muted)("charts "),
      fg(colors.accent)(String(chartCount)),
      fg(colors.border)("  ·  "),
      fg(colors.muted)("cmds "),
      fg(colors.accent)(String(commandCount))
    );
  };

  const updateFooter = () => {
    footerText.content = styled(
      fg(colors.accent)("↑↓"),
      fg(colors.muted)(" history  "),
      fg(colors.accent)("PgUp/PgDn"),
      fg(colors.muted)(" scroll  "),
      fg(colors.accent)("F2"),
      fg(colors.muted)(" chart  "),
      fg(colors.accent)("F3"),
      fg(colors.muted)(" sidebar  "),
      fg(colors.accent)("Ctrl+L"),
      fg(colors.muted)(" clear  "),
      fg(colors.accent)("Ctrl+C"),
      fg(colors.muted)(" exit")
    );
  };

  const updateVariables = () => {
    const variables = env.getVariables();
    variableCount = variables.size;
    variablesPanel.title = ` Variables (${variables.size}) `;
    variablesText.content = variablesStyledText(
      variables,
      Math.max(12, sidebarWidth - 4)
    );
  };

  const updateChart = () => {
    chartPanel.visible = chartVisible;
    chartPanel.borderColor = chartVisible ? colors.borderActive : colors.border;

    if (!chartVisible) return;

    if (!activeChart) {
      chartText.content = styled(
        fg(colors.muted)("No chart yet.\n\n"),
        fg(colors.accent)("plotHist([1, 2, 2, 3], 4)"),
        fg(colors.muted)("\nor\n"),
        fg(colors.accent)("scatter(x, y)")
      );
      chartPanel.title = " Chart ";
      return;
    }

    const width = Math.max(18, sidebarWidth - 4);
    const height = Math.max(4, chartHeight - 2);
    chartText.content = rowsToStyledText(
      renderChartRows(activeChart, width, height)
    );
    chartPanel.title = ` ${fitText(chartTitle(activeChart), Math.max(8, sidebarWidth - 12))} `;
  };

  const applyLayout = () => {
    const width = renderer.width;
    const height = renderer.height;

    sidebarWidth = Math.min(42, Math.max(26, Math.floor(width * 0.38)));
    sidebar.width = sidebarWidth;
    sidebar.visible = sidebarVisible;

    const bodyHeight = Math.max(6, height - 7);
    chartHeight = Math.max(
      5,
      Math.min(12, Math.floor(bodyHeight * 0.5), bodyHeight - 5)
    );
    chartPanel.height = chartHeight;

    chartCount = env.getCharts().length;
    updateHeader();
    updateFooter();
    updateVariables();
    updateChart();
  };

  const showChart = (chart: ChartInfo) => {
    activeChart = chart;
    chartVisible = true;
    sidebarVisible = true;
    applyLayout();
  };

  const toggleChart = () => {
    sidebarVisible = true;
    chartVisible = !chartVisible;
    applyLayout();
    if (chartVisible && !activeChart) {
      append("No chart yet. Try plotHist([1, 2, 2, 3], 4).", colors.muted);
    }
  };

  const toggleSidebar = () => {
    sidebarVisible = !sidebarVisible;
    applyLayout();
  };

  append(
    styled(fg(colors.muted)("Explore data. Calculate boldly. Stay curious."))
  );
  append(
    styled(
      fg(colors.muted)("Variables live in the sidebar. "),
      fg(colors.accent)("help"),
      fg(colors.muted)(" shows the field guide.")
    )
  );

  const onKeyPress = (key: {
    name: string;
    ctrl: boolean;
    preventDefault(): void;
  }) => {
    if (process.env.ISTAT_TUI_DEBUG) process.stderr.write(`KEY name=${key.name} ctrl=${key.ctrl}\n`);
    const name = key.name.toLowerCase();

    if (name === "f2") {
      key.preventDefault();
      toggleChart();
      return;
    }
    if (name === "f3") {
      key.preventDefault();
      toggleSidebar();
      return;
    }
    if (key.ctrl && name === "l") {
      key.preventDefault();
      clearTranscript();
      return;
    }
    if (name === "up" && history.length > 0) {
      key.preventDefault();
      if (historyIndex === history.length) draft = input.value;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] ?? "";
      return;
    }
    if (name === "down" && historyIndex < history.length) {
      key.preventDefault();
      historyIndex += 1;
      input.value =
        historyIndex === history.length
          ? draft
          : (history[historyIndex] ?? "");
      return;
    }
    if (name === "pageup") {
      key.preventDefault();
      transcript.scrollBy(-1, "viewport");
    } else if (name === "pagedown") {
      key.preventDefault();
      transcript.scrollBy(1, "viewport");
    }
  };
  renderer.keyInput.on("keypress", onKeyPress);
  renderer.once("destroy", () => renderer.keyInput.off("keypress", onKeyPress));

  const onResize = () => {
    applyLayout();
  };
  renderer.on("resize", onResize);
  renderer.once("destroy", () => renderer.off("resize", onResize));

  input.on(InputRenderableEvents.ENTER, (value) => {
    if (process.env.ISTAT_TUI_DEBUG) process.stderr.write(`ENTER ${JSON.stringify(value)}\n`);
    const source = value.trim();
    input.value = "";
    historyIndex = history.length;
    draft = "";
    if (source.length === 0) return;

    history.push(source);
    commandCount += 1;
    append(
      styled(fg(colors.accent)(bold("❯ ")), fg(colors.text)(source))
    );

    if (source === "exit" || source === "quit") {
      renderer.destroy();
      return;
    }

    if (source === "clear") {
      env.clearVariables();
      append("All session variables cleared.", colors.muted);
      applyLayout();
      return;
    }

    if (source === "who" || source === "whos" || source === "vars") {
      const variables = env.getVariables();
      if (variables.size === 0) {
        append("No variables defined.", colors.muted);
      } else {
        append(
          styled(
            bold(fg(colors.accent)("Variables")),
            fg(colors.muted)(`  ${variables.size} in session`)
          )
        );
        for (const [name, val] of variables) {
          append(
            styled(
              fg(colors.prompt)(name.padEnd(12)),
              fg(colors.muted)(` ${typeLabel(val)}  `),
              fg(colors.text)(formatSummary(val))
            )
          );
        }
      }
      applyLayout();
      return;
    }

    if (source === "help" || source === "?") {
      for (const line of helpLines) append(line, colors.muted);
      applyLayout();
      return;
    }

    try {
      const chartsBefore = env.getCharts().length;
      const result = evaluate(source, env);
      let outputChart: ChartInfo | undefined;

      for (const output of result.outputs) {
        const chart = env.getChart(output.value);
        if (chart) {
          outputChart = chart;
          continue;
        }
        if (isSvg(output.value)) {
          append(
            "SVG output generated. Use saveSvg(path, svg) to write it to disk.",
            colors.muted
          );
          continue;
        }
        append(output.formatted, colors.result);
      }

      const charts = env.getCharts();
      const newChart =
        charts.length > chartsBefore ? charts[charts.length - 1] : undefined;
      const chart =
        outputChart ?? newChart ?? env.getChart(result.lastValue);

      if (chart) {
        showChart(chart);
        if (outputChart) {
          append(
            styled(
              fg(colors.success)("◈ "),
              fg(colors.text)(chartTitle(chart)),
              fg(colors.muted)(" rendered in the chart panel.")
            )
          );
        }
      } else {
        applyLayout();
      }
    } catch (error) {
      append(
        styled(
          fg(colors.error)("Error: "),
          fg(colors.error)(
            error instanceof Error ? error.message : String(error)
          )
        )
      );
      applyLayout();
    }
  });

  applyLayout();

  try {
    await closed;
  } finally {
    renderer.destroy();
  }
}

function rowsToStyledText(rows: readonly ChartRow[]): StyledText {
  const chunks: TextChunk[] = [];
  rows.forEach((row, rowIndex) => {
    if (rowIndex > 0) chunks.push(fg(colors.text)("\n"));
    for (const segment of row) {
      chunks.push(fg(chartToneColors[segment.tone])(segment.text));
    }
  });
  return new StyledText(chunks);
}

function variablesStyledText(
  variables: Map<string, any>,
  width: number
): StyledText {
  if (variables.size === 0) {
    return new StyledText([
      fg(colors.muted)("No variables yet.\n\n"),
      fg(colors.muted)("Try "),
      fg(colors.accent)("x = 1:2:9"),
      fg(colors.muted)("\nor "),
      fg(colors.accent)("summary([2, 4, 4, 8])"),
    ]);
  }

  const chunks: TextChunk[] = [];
  let index = 0;
  for (const [name, value] of variables) {
    if (index > 0) chunks.push(fg(colors.text)("\n"));
    chunks.push(fg(colors.prompt)(name));
    chunks.push(fg(colors.muted)(`  ${typeLabel(value)}`));
    chunks.push(
      fg(colors.text)(
        `\n  ${fitText(formatSummary(value), Math.max(8, width - 2))}`
      )
    );
    index += 1;
  }
  return new StyledText(chunks);
}

function typeLabel(value: any): string {
  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      return `matrix ${value.length}×${value[0].length}`;
    }
    return `vector [${value.length}]`;
  }
  if (value === null) return "null";
  if (typeof value === "function") return "function";
  if (typeof value === "object") return "object";
  return typeof value;
}

function formatSummary(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length <= 6) return `[ ${value.join(", ")} ]`;
    return `[ ${value.slice(0, 3).join(", ")}, …, ${value.slice(-2).join(", ")} ]`;
  }
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

function fitText(text: string, width: number): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (singleLine.length <= width) return singleLine;
  if (width <= 1) return singleLine.slice(0, width);
  return singleLine.slice(0, width - 1) + "…";
}

const helpLines = [
  "Session: who / whos / vars · clear · exit / quit",
  "TUI: F2 chart · F3 sidebar · Ctrl+L clear transcript",
  "Language: x = 1:2:9 · A = [1 2; 3 4] · A .* B · function y = f(x)",
  "Stats: mean, median, std, var, quantile, summary, mode, zscore",
  "Models: corr, spearman, linreg, polyfit",
  "Matrices: transpose, matmul, dot, det, inv, solve",
  "Chance: normalCdf, binomialPmf, poissonPmf, uniformCdf",
  "Plots: plotHist, scatter, saveSvg",
  "Example: summary([2, 4, 4, 8])",
];
