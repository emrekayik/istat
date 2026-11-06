# iStat

iStat is a Bun-based command-line statistics environment with its own statistical programming language and a modular TypeScript statistics library.

## Requirements

- [Bun](https://bun.sh/) (the project uses Bun scripts and `bun:test`)

## Install

```sh
bun install
```

## Use the CLI

Evaluate an expression or a sequence of statements:

```sh
bun run istat eval -i 'x = 1:5; mean(x)'
```

Start an interactive session:

```sh
bun run istat repl
```

Open the browser-based iStat Studio with the language/library docs, Ace editor, and runnable examples:

```sh
bun run istat editor
```

Studio listens only on `127.0.0.1`; use `--port 0` to choose an available port.

Run a script file:

```sh
bun run istat run examples/analysis.istat
```

The path can also be passed with `-f/--file`, or directly after `istat`:

```sh
bun run istat run -f examples/analysis.istat
bun run istat examples/analysis.istat
```

> `bun run -f examples/analysis.istat` does not reach iStat: Bun parses `-f` before the
> package script and exits with `Invalid Argument '-f'`. Use one of the commands above
> (or `bun --silent istat run ...` to hide Bun's script echo).

Import a CSV, XLSX, or JSON file in a script with `readData(path)`. For example, `rows = readData("examples/measurements.csv"); scores = column(rows, "score"); mean(scores)` reads a CSV using its first row as headers.

The `eval` command also supports `--json` for machine-readable output. `eval` and `run` support `--svg <path>` to save an SVG chart returned by the last statement. See the [CLI guide](docs/cli.md) and [language reference](docs/language.md) for command options and syntax.

## Use the TypeScript library

Import functions from the library entry point:

```ts
import { mean, linearRegression } from "./src/istat";

console.log(mean([1, 2, 3, 4, 5])); // 3

const model = linearRegression([1, 2, 3], [3, 5, 7]);
console.log(model.predict(4)); // 9
```

See the [library reference](docs/library.md) for the exported modules and API overview.

## Development

```sh
bun run test          # Run tests
bun run typecheck     # Type-check the project
bun run build         # Build the CLI
bun run build:library # Build the distributable statistics library
```

GitHub Actions runs checks and creates CLI, library (`.tgz`), and VS Code (`.vsix`)
artifacts for pushes and pull requests. Push a tag matching the library version
(for example, `v0.1.0`) to create a GitHub Release with those packages attached.

## Project layout

- `src/commands/` — CLI commands (`eval`, `repl`, `run`)
- `src/core/` — parser, AST, and interpreter
- `src/grammar.peggy` — language grammar
- `src/istat/` — statistics library and SVG rendering
- `examples/` — runnable `.istat` scripts
- `test/` — CLI-language and library tests
