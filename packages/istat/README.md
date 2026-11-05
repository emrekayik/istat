# istat-statistics

The iStat statistics and numerical-computing library.

```ts
import { mean, linearRegression } from "istat-statistics";

console.log(mean([1, 2, 3, 4, 5])); // 3

const model = linearRegression([1, 2, 3], [3, 5, 7]);
console.log(model.predict(4)); // 9
```

See the [library reference](./docs/library.md) for the available functions.
