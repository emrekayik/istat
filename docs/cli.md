# CLI guide

iStat is run with Bun from the repository root. The package script forwards arguments to `src/index.ts`:

```sh
bun run istat --help
```

The CLI has three commands: `eval`, `run`, and `repl`.

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

For example, `bun run istat eval -i 'x = [1, 2, 2, 3]; plotHist(x, 4, "Counts")' --svg histogram.svg` evaluates the chart expression and writes its SVG to `histogram.svg`.

## `run`

Execute a script from a file:

```sh
bun run istat run -f examples/analysis.istat
```

The command accepts `.istat` and `.m` files. Other extensions produce a warning, but the file is still attempted. Statements without a trailing semicolon are printed. A trailing semicolon suppresses the statement's regular output.

Options:

| Option | Description |
| --- | --- |
| `-f, --file <path>` | Script file to execute |
| `-s, --svg <path>` | Save the last result as an SVG when it is SVG markup |

## `repl`

Start a persistent interactive session:

```sh
bun run istat repl
```

Enter one or more expressions at the `iStat>` prompt. Built-in REPL commands:

| Command | Description |
| --- | --- |
| `who`, `whos`, `vars` | List variables in the current session |
| `clear` | Clear user variables |
| `help`, `?` | Print the REPL help |
| `exit`, `quit` | Leave the REPL |

## Error behavior

The CLI reports parse and runtime errors and exits with a non-zero status for failed `eval` and `run` commands. A missing script file is reported as a file-not-found error.

## Script example

```matlab
x = 1:10;
y = 2.5 * x + 4;

avg = mean(y)
model = linreg(x, y);
prediction = model.predict(11)
```

See the [language reference](language.md) for supported syntax and built-in functions.
