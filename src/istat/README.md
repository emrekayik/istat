# Statistics library

The `istat` TypeScript library is documented in [`../../docs/library.md`](../../docs/library.md).

Its public entry point is `src/istat/index.ts`, which exports both flat function names and namespaces for descriptive statistics, correlation, regression, streaming, sorting, and SVG rendering.

## Module layout

- `descriptive/` — descriptive statistics such as mean, median, variance, quantiles, summaries, histograms, and missing-data helpers.
- `probability/` — probability distributions split by family: `normal.ts`, `binomial.ts`, `poisson.ts`, `uniform.ts`, plus shared numerical helpers in `special.ts`.
- `correlation/`, `regression/`, `streaming/`, `sorting/` — focused statistical modules.
- `io.ts` — CSV, XLSX/XLS, and JSON import/export helpers.
- `render/` — SVG chart rendering.
- `internal/` — shared validation and numeric utilities.
