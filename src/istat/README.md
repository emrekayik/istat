# `istat` - Modular Statistics and Numerical Computation Library

This directory contains a modular, type-safe, and easily extensible statistics engine.

---

## 📁 Directory Architecture

```text
src/istat/
├── internal/              # Shared utilities, common types, and assertions
│   ├── types.ts           # Data, Pair, Point2D, etc.
│   ├── validate.ts        # assertNonEmpty, assertMinLength, assertEqualLengths, etc.
│   ├── kahan-sum.ts       # Numerical stability functions (neumaierSum, etc.)
│   └── index.ts
│
├── descriptive/           # Descriptive Statistics
│   ├── mean.ts, median.ts, variance.ts, stdev.ts, quantile.ts, summary.ts, histogram.ts
│   └── index.ts
│
├── correlation/           # Correlation & Association Measures
│   ├── covariance.ts, pearson.ts, spearman.ts
│   └── index.ts
│
├── regression/            # Regression Models
│   ├── linear.ts, polynomial.ts
│   └── index.ts
│
├── streaming/             # Online / Streaming Accumulators (Welford)
│   ├── mean.ts, variance.ts
│   └── index.ts
│
├── sorting/               # Numeric Sorting & Selection Algorithms
│   ├── sort.ts, quickselect.ts
│   └── index.ts
│
├── render/ (src/render/)  # SVG Chart Visualizations
│   ├── svg.ts (histogramToSvg, scatterToSvg)
│   └── index.ts
│
├── istat.test.ts          # Unit tests (bun test)
└── index.ts               # Main entry point (namespaces and flat exports)
```

---

## 🚀 How to Add a New Feature (2 Steps)

### Step 1: Create your function in the appropriate subfolder
For example, to add **Mode** to descriptive statistics, create `src/istat/descriptive/mode.ts`:

```ts
import { assertNonEmpty } from "../internal/validate";
import type { Data } from "../internal/types";

export function mode(data: Data): number[] {
  assertNonEmpty(data, "mode");
  
  const freq = new Map<number, number>();
  let maxFreq = 0;
  for (const x of data) {
    const count = (freq.get(x) ?? 0) + 1;
    freq.set(x, count);
    if (count > maxFreq) maxFreq = count;
  }

  const result: number[] = [];
  for (const [val, count] of freq) {
    if (count === maxFreq) result.push(val);
  }
  return result;
}
```

### Step 2: Re-export in that subfolder's `index.ts`
Add one line to `src/istat/descriptive/index.ts`:

```ts
export * from "./mode";
```

**Done!** Since the main `src/istat/index.ts` re-exports all submodules, your new function is automatically available:
```ts
import { mode } from "./istat"; // Direct import
import { descriptive } from "./istat"; // descriptive.mode(...)
```

---

## 🛠 Reusable Validation Helpers (`internal/validate.ts`)

No need to re-write repetitive validation code:
- `assertNonEmpty(data, fnName)`: Ensures the array is not empty.
- `assertMinLength(data, minLength, fnName)`: Ensures minimum array length (e.g., $n \ge 2$ for sample variance).
- `assertEqualLengths(x, y, fnName)`: Ensures two arrays have identical lengths (covariance, regression).
- `assertInRange(val, min, max, name, fnName)`: Validates range (e.g., quantile $p \in [0, 1]$).
- `assertFinite(val, name, fnName)`: Ensures the number is valid and finite.
