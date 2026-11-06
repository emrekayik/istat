# CLI guide

iStat is run with Bun from the repository root. The package script forwards arguments to `src/index.ts`:

```sh
bun run istat --help
```

The CLI has four commands: `editor`, `eval`, `run`, and `repl`.

## `editor`

Start iStat Studio, a local browser-based editor with the language, library, and CLI documentation, runnable iStat examples, and the Ace code editor:

```sh
bun run istat editor
```

The editor is served only on `127.0.0.1` and uses the same interpreter as the CLI. Select an example category, edit the code, then click **Run** or press `Ctrl+Enter` (`⌘+Enter` on macOS). Example scripts include runnable demonstrations of the interpreter's built-in statistics, matrix, probability, regression, data import, timing, math, and plotting functions. Each script run starts with a fresh environment. The interactive console below it keeps variables between commands; enter one expression at a time and use `vars` to inspect or `clear` to reset the console session.

Options:

| Option | Description |
| --- | --- |
| `-p, --port <number>` | Local server port (default `4173`; `0` chooses an available port) |

## `eval`

Evaluate an expression or multiple statements passed as a string:

```sh
bun run istat eval -i 'x = 1:5; mean(x)'
```

Options:

| Option | Description |
| --- | --- |
| `-i, --input <code>` | Code to evaluate |
| `-j, --json` | Print the input, last result, and variables as JSON |
| `-s, --svg <path>` | Save the last result as an SVG when it is SVG markup |

For example, `bun run istat eval -i 'x = [1, 2, 2, 3]; plotHist(x, 4, "Counts")' --svg histogram.svg` evaluates the chart expression and writes its SVG to `histogram.svg`. `plotLine`, `bar`, and `scatter` return SVG markup as well, so the same flag works for every chart type. The saved markup is not echoed to the terminal. If the last result is not SVG markup, iStat prints a warning and writes no file.

With `--json`, the saved path is included as an `svg` field and the save confirmation is written to stderr, so stdout remains valid JSON.

## `run`

Execute a script from a file:

```sh
bun run istat run examples/analysis.istat
```

The path can be passed positionally, with `-f/--file`, or directly after `istat`:

```sh
bun run istat run -f examples/analysis.istat
bun run istat examples/analysis.istat
```

> `bun run -f examples/analysis.istat` does not reach iStat: Bun parses `-f` before the
> package script and exits with `Invalid Argument '-f'`. Use one of the commands above
> (or `bun --silent istat run ...` to hide Bun's script echo).

The command accepts `.istat` and `.m` files. Other extensions produce a warning, but the file is still attempted. Statements without a trailing semicolon are printed. A trailing semicolon suppresses the statement's regular output.

Options:

| Option | Description |
| --- | --- |
| `-f, --file <path>` | Script file to execute |
| `-s, --svg <path>` | Save the last result as an SVG when it is SVG markup |

As with `eval`, saved SVG markup is omitted from the normal output, and `--svg` warns instead of writing a file when the last result is not SVG.

## `repl`

Start a persistent interactive session:

```sh
bun run istat repl
```

When launched in a terminal, the REPL opens an OpenTUI screen with a session
header, a session transcript, a variables sidebar, a chart panel, and an
editable input. The header tracks variable, chart, and command counts; the
sidebar summarizes current variables and updates after each command.

Plot functions render directly in the chart panel as Unicode charts while still
returning SVG markup for `saveSvg` and `--svg`. A new chart opens the panel
automatically. The panel can show a histogram, line chart, bar chart, or scatter
plot, and the transcript keeps the textual result. iStat keeps the charts
created during the session so you can revisit them with the chart history keys.

| Key | Action |
| --- | --- |
| Up / Down | Recall previous commands |
| Page Up / Page Down | Scroll the session transcript |
| F2 | Show or hide the chart panel |
| F3 | Show or hide the variables sidebar |
| F4 | Toggle fullscreen chart view |
| F5 | Show the next chart in history |
| F6 | Show the previous chart in history |
| Ctrl+L | Clear the transcript |
| Ctrl+C | Exit the REPL |

When input is piped or the terminal interface is unavailable, the REPL uses the
line-oriented prompt.

Built-in REPL commands:

| Command | Description |
| --- | --- |
| `who`, `whos`, `vars` | List variables in the current session |
| `clear` | Clear user variables |
| `help`, `?` | Print the REPL help |
| `exit`, `quit` | Leave the REPL |

## Output formats

The CLI framework formats its built-in output, such as `--help`, `--version`, and command errors, as readable text in a terminal and as JSON when stdout is piped. Pass the global `--format json|yaml|md|toon` flag to choose explicitly. The `eval --json` flag is separate: it formats the evaluation result itself.

## Error behavior

The CLI reports parse and runtime errors and exits with a non-zero status for failed `eval` and `run` commands. A missing input, file path, or script file is reported as a clear error with a non-zero status.

## Script example

```istat
x = 1:10;
y = 2.5 * x + 4;

avg = mean(y)
model = linreg(x, y);
prediction = model.predict(11)
```

See the [language reference](language.md) for supported syntax and built-in functions.
