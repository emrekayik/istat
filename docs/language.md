# iStat language reference

iStat implements a MATLAB/Octave-inspired language subset for evaluating numeric expressions and statistical analyses. It is not a full MATLAB or Octave implementation.

## Values and variables

The language supports numbers, quoted strings, booleans, identifiers, vectors, and matrices:

```matlab
rate = 2.5;
enabled = true;
label = "sample";
values = [1, 2, 3];
matrix = [1 2; 3 4];
```

Both single- and double-quoted strings are accepted. Matrix rows are separated by semicolons or newlines; values within a row can be separated by commas or spaces.

## Expressions

Supported operators include:

- Arithmetic: `+`, `-`, `*`, `/`, `.*`, `./`, `^`, `.^`
- Comparisons: `<`, `<=`, `>`, `>=`, `==`, `!=`, `~=`
- Logical: `&`, `&&`, `|`, `||`
- Unary: `+`, `-`, `!`, `~`

Use parentheses to group expressions. Built-in math functions accept scalar values; the unary math functions also operate element-wise on arrays.

## Ranges and indexing

Ranges are inclusive when the step reaches the endpoint:

```matlab
whole = 1:5;       % [1, 2, 3, 4, 5]
odds = 1:2:9;      % [1, 3, 5, 7, 9]
countdown = 5:-1:1;
```

Indexing uses MATLAB-style 1-based positions:

```matlab
first = whole(1);
alsoFirst = whole[1];
cell = matrix(2, 1);
```

Both parentheses and square brackets are accepted for indexing.

## Statements and comments

Statements can be separated by a newline or semicolon. A semicolon after an assignment or expression suppresses that statement's displayed output:

```matlab
answer = 6 * 7;
answer
```

The second statement is displayed; the assignment is not. Supported comment forms are `%`, `//`, `#`, and `/* ... */`.

## Control flow

Conditional branches use `if`, optional `elseif`/`else`, and an `end` terminator (`endif` is also accepted):

```matlab
x = 5;
if x > 0
  result = "positive";
else
  result = "not positive";
end
```

`for` and `while` loops are supported, along with `break` and `continue`:

```matlab
total = 0;
for i = 1:5
  total = total + i;
end
```

## User-defined functions

Define a function at the top level with one output name, a function name, and zero or more parameters:

```matlab
centered = center(values);

function result = center(data)
  result = data - mean(data);
end
```

Function declarations may appear before or after their calls and can call themselves recursively. Each call gets its own local variables; pass values as parameters rather than relying on variables from the script. The function must assign its declared output, and calls must provide exactly the declared number of arguments. Use `end` or `endfunction` to close the definition. Multiple return values and nested function declarations are not supported.

## Built-in functions

The interpreter provides:

| Category               | Functions                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Descriptive statistics | `mean`, `median`, `variance` / `var`, `stdev` / `std`, `quantile`, `summary`, `histogram` / `hist` |
| Correlation            | `covariance` / `cov`, `pearson` / `corr`, `spearman`                                                         |
| Regression             | `linreg` / `linearRegression`, `polyfit` / `polyreg`                                                           |
| Sorting                | `sort`, `quickselect`                                                                                              |
| Arrays and arithmetic  | `sum`, `min`, `max`, `length`, `size`, `zeros`, `ones`, `linspace`, `mod`, `rem`                   |
| Math                   | `sqrt`, `abs`, `sin`, `cos`, `tan`, `log`, `log10`, `log2`, `exp`, `round`, `floor`, `ceil`    |
| Charts and output      | `plotHist`, `scatter`, `saveSvg`, `disp`                                                                       |

The constants `pi`, `e`, `inf`/`Inf`, and `nan`/`NaN` are available. For function parameters, options, and return types, see the [TypeScript library reference](library.md).

## Interpreter API

The parser and evaluator are available from `src/core/parser.ts`:

```ts
import { createEnvironment, evaluate, parse } from "./src/core/parser";

const ast = parse("x = 1:5; mean(x)");
const env = createEnvironment();
const result = evaluate("x = 1:5; mean(x)", env);

console.log(ast.type);          // "Program"
console.log(result.lastValue);  // 3
console.log(env.get("x"));      // [1, 2, 3, 4, 5]
```

Pass the same `Environment` to successive `evaluate` calls to retain variables between them.
