# TypeScript library reference

The statistical library is exported from `src/istat/index.ts`. It offers both flat named exports and module namespaces.

```ts
import { mean, descriptive, regression } from "./src/istat";

mean([1, 2, 3]);                     // 2
descriptive.median([1, 2, 3]);       // 2
regression.linearRegression([1, 2, 3], [3, 5, 7]).predict(4); // 9
```

The common input type is `Data`, a readonly array of numbers (`readonly number[]`). Functions validate their inputs and throw on invalid data.

## Descriptive statistics

Exports: `mean`, `median`, `variance`, `stdev`, `quantile`, `summary`, and `histogram`.

- `variance(data, sample = true)` and `stdev(data, sample = true)` use sample statistics by default. Pass `false` for population variance or standard deviation.
- `quantile(data, p, options?)` accepts `p` in `[0, 1]`; its interpolation method is `linear` by default. Other methods are `lower`, `higher`, `nearest`, and `midpoint`.
- `histogram(data, options?)` returns `Bin[]` values shaped as `{ x0, x1, count }`. `options.bins` accepts a bin count or `"sturges"`, `"freedman-diaconis"`, `"scott"`, or `"sqrt"`. Bounds can be set with `min` and `max`.
- `summary(data)` returns count, minimum, maximum, sum, mean, variance, standard deviation, and median.

```ts
import { histogram, mean, quantile, summary } from "./src/istat";

const data = [1, 2, 2, 3, 4];
mean(data);                           // 2.4
quantile(data, 0.5);                  // 2
summary(data);
histogram(data, { bins: "sqrt" });
```

## Correlation and regression

Exports: `covariance`, `pearson`, `spearman`, `linearRegression`, and `polynomialRegression`.

The two-series functions require equal-length inputs. `covariance(x, y, sample = true)` uses sample covariance by default. Linear and polynomial regression return model objects with an `r2` value and a `predict(x)` method. Linear regression also returns `slope` and `intercept`; polynomial regression returns coefficients ordered from constant term upward.

```ts
import { linearRegression, pearson, polynomialRegression } from "./src/istat";

const x = [1, 2, 3, 4];
const y = [3, 5, 7, 9];

pearson(x, y);                       // 1
linearRegression(x, y).predict(5);   // 11
polynomialRegression(x, y, 1).r2;   // 1
```

## Streaming

`MeanAccumulator` and `VarianceAccumulator` update statistics as values arrive. Both expose `add(value)` and `count`; the `add` method is chainable. `MeanAccumulator.mean` is `NaN` before any values are added.

`VarianceAccumulator(sample = true)` exposes `mean`, `variance`, and `stdev`. The one-pass helpers `meanStream(iterable)` and `varianceStream(iterable, sample = true)` accept any `Iterable<number>`.

```ts
import { MeanAccumulator, VarianceAccumulator } from "./src/istat";

const mean = new MeanAccumulator().add(10).add(20).add(30).mean; // 20
const variance = new VarianceAccumulator(false);
[2, 4, 4, 4, 5, 5, 7, 9].forEach((value) => variance.add(value));
variance.variance; // 4 (population variance)
```

## Sorting and selection

- `numericSort(data, ascending = true)` returns a sorted copy and leaves the input unchanged.
- `quickselect(array, k)` returns the `k`th smallest element for zero-based `k`. It may mutate the provided array.

## SVG charts

`histogramToSvg(bins, options?)` and `scatterToSvg(points, options?)` return standalone SVG strings. `SvgChartOptions` supports `width`, `height`, `padding`, `title`, `xLabel`, `yLabel`, `fill`, and `fontSize`.

```ts
import { histogram, histogramToSvg } from "./src/istat";

const bins = histogram([1, 2, 2, 3, 4], { bins: 4 });
const svg = histogramToSvg(bins, {
  title: "Distribution",
  xLabel: "Value",
  yLabel: "Count",
});
```

## Namespaces and types

The entry point exports `descriptive`, `correlation`, `regression`, `streaming`, `sorting`, `internal`, and `render` namespaces. It also re-exports public functions and types, including `Data`, `Bin`, `DescriptiveSummary`, `LinearRegressionResult`, and `PolynomialRegressionResult`.

Implementation modules are organized under `src/istat/`; their `index.ts` files define the corresponding namespace exports.
