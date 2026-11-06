import {
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
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

const MAX_TRANSCRIPT_LINES = 800;

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

  const transcript = new BoxRenderable(renderer, {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 0,
    border: true,
    borderStyle: "rounded",
    borderColor: colors.border,
    title: " Session ",
    titleAlignment: "left",
    paddingX: 1,
    paddingY: 0,
    overflow: "hidden",
  });
  const transcriptText = new TextRenderable(renderer, {
    width: "100%",
    height: "100%",
    content: "",
    fg: colors.text,
    wrapMode: "none",
    overflow: "hidden",
  });
  transcript.add(transcriptText);

  const sidebar = new BoxRenderable(renderer, {
    width: 32,
    flexShrink: 0,
    minHeight: 0,
    flexDirection: "column",
    gap: 1,
    backgroundColor: colors.background,
  });

  const variablesPanel = new BoxRenderable(renderer, {
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 4,
    border: true,
    borderStyle: "rounded",
    borderColor: colors.border,
    title: " Variables ",
    titleAlignment: "left",
    paddingX: 1,
    paddingY: 0,
    overflow: "hidden",
  });
  const variablesText = new TextRenderable(renderer, {
    width: "100%",
    height: "100%",
    content: "",
    fg: colors.text,
    wrapMode: "none",
    overflow: "hidden",
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
  let bodyHeight = 10;
  let transcriptWidth = 40;
  let transcriptVisible = 1;
  let transcriptScroll = 0;
  let transcriptFollow = true;
  let transcriptLines: StyledText[] = [];

  const styled = (...chunks: TextChunk[]): StyledText => new StyledText(chunks);

  const renderTranscript = () => {
    const total = transcriptLines.length;
    const visible = Math.max(1, transcriptVisible);
    const maxScroll = Math.max(0, total - visible);
    transcriptScroll = Math.min(Math.max(0, transcriptScroll), maxScroll);
    const start = transcriptScroll;
    const end = Math.min(total, start + visible);
    const chunks: TextChunk[] = [];
    for (let index = start; index < end; index++) {
      if (index > start) chunks.push(fg(colors.text)("\n"));
      chunks.push(...transcriptLines[index]!.chunks);
    }
    transcriptText.content = new StyledText(
      chunks.length > 0 ? chunks : [fg(colors.text)("")]
    );
    transcript.title =
      total > visible
        ? ` Session · ${start + 1}-${end}/${total} `
        : " Session ";
  };

  const append = (content: string | StyledText, color = colors.text) => {
    const value =
      typeof content === "string" ? styled(fg(color)(content)) : content;
    transcriptLines.push(...wrapStyledText(value, transcriptWidth));
    if (transcriptLines.length > MAX_TRANSCRIPT_LINES) {
      transcriptLines = transcriptLines.slice(-MAX_TRANSCRIPT_LINES);
    }
    if (transcriptFollow) {
      transcriptScroll = Math.max(0, transcriptLines.length - transcriptVisible);
    }
    renderTranscript();
  };

  const clearTranscript = () => {
    transcriptLines = [];
    transcriptScroll = 0;
    transcriptFollow = true;
    renderTranscript();
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
    if (renderer.width < 80) {
      footerText.content = styled(
        fg(colors.accent)("↑↓"),
        fg(colors.muted)(" history · "),
        fg(colors.accent)("PgUp/PgDn"),
        fg(colors.muted)(" scroll · "),
        fg(colors.accent)("F2"),
        fg(colors.muted)(" chart · "),
        fg(colors.accent)("F3"),
        fg(colors.muted)(" side · "),
        fg(colors.accent)("^L"),
        fg(colors.muted)(" clear · "),
        fg(colors.accent)("^C"),
        fg(colors.muted)(" exit")
      );
      return;
    }
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

    const width = Math.max(12, sidebarWidth - 4);
    const panelHeight = Math.max(
      3,
      chartVisible ? bodyHeight - chartHeight - 1 : bodyHeight
    );
    const maxLines = Math.max(1, panelHeight - 2);
    const allLines = variableLines(variables, width);
    let visible = allLines;

    if (allLines.length > maxLines) {
      if (maxLines > 1) {
        visible = [
          ...allLines.slice(0, maxLines - 1),
          styled(fg(colors.muted)(`… ${allLines.length - (maxLines - 1)} more`)),
        ];
      } else {
        visible = [styled(fg(colors.muted)(`… ${allLines.length} more`))];
      }
    }

    variablesText.content = joinStyledLines(visible);
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

    bodyHeight = Math.max(6, height - 7);
    chartHeight = Math.max(
      6,
      Math.min(12, Math.floor(bodyHeight * 0.5), bodyHeight - 5)
    );
    chartPanel.height = chartHeight;

    transcriptVisible = Math.max(1, bodyHeight - 2);
    const nextTranscriptWidth = Math.max(
      12,
      sidebarVisible ? width - sidebarWidth - 7 : width - 6
    );
    if (nextTranscriptWidth !== transcriptWidth) {
      transcriptWidth = nextTranscriptWidth;
      transcriptLines = transcriptLines.flatMap((line) =>
        wrapStyledText(line, transcriptWidth)
      );
      if (transcriptLines.length > MAX_TRANSCRIPT_LINES) {
        transcriptLines = transcriptLines.slice(-MAX_TRANSCRIPT_LINES);
      }
    }
    if (transcriptFollow) {
      transcriptScroll = Math.max(0, transcriptLines.length - transcriptVisible);
    }
    renderTranscript();

    chartCount = env.getCharts().length;
    updateVariables();
    updateChart();
    updateHeader();
    updateFooter();
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

  applyLayout();

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
      transcriptFollow = false;
      transcriptScroll = Math.max(
        0,
        transcriptScroll - Math.max(1, transcriptVisible - 1)
      );
      renderTranscript();
    } else if (name === "pagedown") {
      key.preventDefault();
      const maxScroll = Math.max(0, transcriptLines.length - transcriptVisible);
      transcriptScroll = Math.min(
        maxScroll,
        transcriptScroll + Math.max(1, transcriptVisible - 1)
      );
      transcriptFollow = transcriptScroll >= maxScroll;
      renderTranscript();
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
    const source = value.trim();
    input.value = "";
    historyIndex = history.length;
    draft = "";
    if (source.length === 0) return;

    history.push(source);
    commandCount += 1;
    transcriptFollow = true;
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

function wrapStyledText(content: StyledText, width: number): StyledText[] {
  const limit = Math.max(1, width);
  const lines: TextChunk[][] = [[]];
  let column = 0;

  const push = (chunk: TextChunk, text: string) => {
    if (text.length === 0) return;
    const line = lines[lines.length - 1]!;
    const previous = line[line.length - 1];
    if (
      previous &&
      previous.fg === chunk.fg &&
      previous.bg === chunk.bg &&
      previous.attributes === chunk.attributes &&
      previous.link === chunk.link
    ) {
      previous.text += text;
    } else {
      line.push({ ...chunk, text });
    }
  };

  for (const chunk of content.chunks) {
    const text = chunk.text;
    let index = 0;

    while (index < text.length) {
      const char = text[index]!;
      if (char === "\n") {
        lines.push([]);
        column = 0;
        index += 1;
        continue;
      }

      let end = index;
      const whitespace = char === " " || char === "\t";
      while (
        end < text.length &&
        text[end] !== "\n" &&
        (text[end] === " " || text[end] === "\t") === whitespace
      ) {
        end += 1;
      }

      let token = text.slice(index, end);
      index = end;

      if (whitespace) {
        if (column === 0) continue;
        if (column + token.length > limit) {
          lines.push([]);
          column = 0;
          continue;
        }
        push(chunk, token);
        column += token.length;
        continue;
      }

      if (column > 0 && column + token.length > limit) {
        lines.push([]);
        column = 0;
      }

      while (token.length > 0) {
        const room = limit - column;
        if (room <= 0) {
          lines.push([]);
          column = 0;
          continue;
        }
        const part = token.slice(0, room);
        push(chunk, part);
        column += part.length;
        token = token.slice(room);
        if (token.length > 0) {
          lines.push([]);
          column = 0;
        }
      }
    }
  }

  return lines.map((line) =>
    line.length > 0
      ? new StyledText(line)
      : new StyledText([fg(colors.text)("")])
  );
}

function joinStyledLines(lines: readonly StyledText[]): StyledText {
  if (lines.length === 0) return new StyledText([fg(colors.text)("")]);
  const chunks: TextChunk[] = [];
  lines.forEach((line, index) => {
    if (index > 0) chunks.push(fg(colors.text)("\n"));
    chunks.push(...line.chunks);
  });
  return new StyledText(chunks);
}

function variableLines(
  variables: Map<string, any>,
  width: number
): StyledText[] {
  if (variables.size === 0) {
    return [
      new StyledText([fg(colors.muted)("No variables yet.")]),
      new StyledText([fg(colors.text)("")]),
      new StyledText([
        fg(colors.muted)("Try "),
        fg(colors.accent)("x = 1:2:9"),
      ]),
      new StyledText([
        fg(colors.muted)("or "),
        fg(colors.accent)("summary([2, 4, 4, 8])"),
      ]),
    ];
  }

  const lines: StyledText[] = [];
  for (const [name, value] of variables) {
    const nameText = fitText(name, Math.max(4, width - 12));
    const typeText = fitText(
      typeLabel(value),
      Math.max(4, width - nameText.length - 2)
    );
    lines.push(
      new StyledText([
        fg(colors.prompt)(nameText),
        fg(colors.muted)(`  ${typeText}`),
      ])
    );
    lines.push(
      new StyledText([
        fg(colors.text)(
          `  ${fitText(formatSummary(value), Math.max(8, width - 2))}`
        ),
      ])
    );
  }
  return lines;
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
  if (typeof value === "string") {
    if (value.startsWith("<svg")) return `<svg · ${value.length} chars>`;
    return value;
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
