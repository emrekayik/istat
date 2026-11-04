const builtinFunctions = [
  ["mean", "mean(data)", "Descriptive statistics"],
  ["median", "median(data)", "Descriptive statistics"],
  ["variance", "variance(data, sample)", "Descriptive statistics"],
  ["var", "var(data, sample)", "Descriptive statistics"],
  ["stdev", "stdev(data, sample)", "Descriptive statistics"],
  ["std", "std(data, sample)", "Descriptive statistics"],
  ["quantile", "quantile(data, p, method)", "Descriptive statistics"],
  ["summary", "summary(data)", "Descriptive statistics"],
  ["histogram", "histogram(data, bins)", "Descriptive statistics"],
  ["hist", "hist(data, bins)", "Descriptive statistics"],
  ["mode", "mode(data)", "Descriptive statistics"],
  ["skewness", "skewness(data)", "Descriptive statistics"],
  ["kurtosis", "kurtosis(data)", "Descriptive statistics"],
  ["zscore", "zscore(data)", "Descriptive statistics"],
  ["covarianceMatrix", "covarianceMatrix(data, sample)", "Descriptive statistics"],
  ["covariance", "covariance(x, y, sample)", "Correlation"],
  ["cov", "cov(x, y, sample)", "Correlation"],
  ["pearson", "pearson(x, y)", "Correlation"],
  ["corr", "corr(x, y)", "Correlation"],
  ["spearman", "spearman(x, y)", "Correlation"],
  ["linreg", "linreg(x, y)", "Regression"],
  ["linearRegression", "linearRegression(x, y)", "Regression"],
  ["polyfit", "polyfit(x, y, degree)", "Regression"],
  ["polyreg", "polyreg(x, y, degree)", "Regression"],
  ["transpose", "transpose(data)", "Matrix and linear algebra"],
  ["matmul", "matmul(a, b)", "Matrix and linear algebra"],
  ["dot", "dot(a, b)", "Matrix and linear algebra"],
  ["eye", "eye(size)", "Matrix and linear algebra"],
  ["diag", "diag(data)", "Matrix and linear algebra"],
  ["trace", "trace(data)", "Matrix and linear algebra"],
  ["det", "det(data)", "Matrix and linear algebra"],
  ["inv", "inv(data)", "Matrix and linear algebra"],
  ["solve", "solve(a, b)", "Matrix and linear algebra"],
  ["normalPdf", "normalPdf(x, mean, sd)", "Probability"],
  ["normalCdf", "normalCdf(x, mean, sd)", "Probability"],
  ["binomialPmf", "binomialPmf(k, n, p)", "Probability"],
  ["binomialCdf", "binomialCdf(k, n, p)", "Probability"],
  ["poissonPmf", "poissonPmf(k, rate)", "Probability"],
  ["poissonCdf", "poissonCdf(k, rate)", "Probability"],
  ["uniformPdf", "uniformPdf(x, min, max)", "Probability"],
  ["uniformCdf", "uniformCdf(x, min, max)", "Probability"],
  ["sort", "sort(data, asc)", "Sorting"],
  ["quickselect", "quickselect(data, k)", "Sorting"],
  ["sum", "sum(data)", "Arrays and arithmetic"],
  ["min", "min(data)", "Arrays and arithmetic"],
  ["max", "max(data)", "Arrays and arithmetic"],
  ["length", "length(data)", "Arrays and arithmetic"],
  ["size", "size(data)", "Arrays and arithmetic"],
  ["zeros", "zeros(rows, columns)", "Arrays and arithmetic"],
  ["ones", "ones(rows, columns)", "Arrays and arithmetic"],
  ["linspace", "linspace(start, end, count)", "Arrays and arithmetic"],
  ["mod", "mod(a, b)", "Arrays and arithmetic"],
  ["rem", "rem(a, b)", "Arrays and arithmetic"],
  ["sqrt", "sqrt(x)", "Math"],
  ["abs", "abs(x)", "Math"],
  ["sin", "sin(x)", "Math"],
  ["cos", "cos(x)", "Math"],
  ["tan", "tan(x)", "Math"],
  ["log", "log(x)", "Math"],
  ["log10", "log10(x)", "Math"],
  ["log2", "log2(x)", "Math"],
  ["exp", "exp(x)", "Math"],
  ["round", "round(x)", "Math"],
  ["floor", "floor(x)", "Math"],
  ["ceil", "ceil(x)", "Math"],
  ["now", "now()", "Time and benchmarking"],
  ["tic", "tic()", "Time and benchmarking"],
  ["toc", "toc(startTime)", "Time and benchmarking"],
  ["benchmark", "benchmark(function, iterations, warmup)", "Time and benchmarking"],
  ["readData", "readData(path, sheet)", "Data import"],
  ["readCsv", "readCsv(path, header)", "Data import"],
  ["readXlsx", "readXlsx(path, sheet, header)", "Data import"],
  ["readJson", "readJson(path)", "Data import"],
  ["column", "column(rows, key)", "Data import"],
  ["plotHist", "plotHist(data, bins, title)", "Charts and output"],
  ["scatter", "scatter(x, y, title)", "Charts and output"],
  ["saveSvg", "saveSvg(path, svg)", "Charts and output"],
  ["disp", "disp(value)", "Charts and output"]
];

const keywords = [
  ["if", "Start a conditional block"],
  ["elseif", "Add a conditional branch"],
  ["else", "Add a fallback branch"],
  ["for", "Start a for loop"],
  ["while", "Start a while loop"],
  ["function", "Define a function"],
  ["end", "End a block"],
  ["endif", "End an if block"],
  ["endfor", "End a for loop"],
  ["endwhile", "End a while loop"],
  ["endfunction", "End a function"],
  ["break", "Exit the innermost loop"],
  ["continue", "Continue the innermost loop"]
];

function findUserSymbols(text) {
  const source = text
    .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/%[^\r\n]*|\/\/[^\r\n]*|#[^\r\n]*/g, " ");
  const symbols = new Set();
  const assignment = /^\s*([A-Za-z_]\w*)\s*=/gm;
  const functionDeclaration =
    /^\s*function\s+([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*\(([^)]*)\)/gm;
  const loopVariable = /^\s*for\s+([A-Za-z_]\w*)\s*=/gm;
  let match;

  while ((match = assignment.exec(source))) symbols.add(match[1]);
  while ((match = functionDeclaration.exec(source))) {
    symbols.add(match[1]);
    symbols.add(match[2]);
    for (const parameter of match[3].split(",")) {
      const name = parameter.trim();
      if (/^[A-Za-z_]\w*$/.test(name)) symbols.add(name);
    }
  }
  while ((match = loopVariable.exec(source))) symbols.add(match[1]);

  return [...symbols];
}

function activate(context) {
  const vscode = require("vscode");
  const provider = vscode.languages.registerCompletionItemProvider(
    { language: "istat" },
    createCompletionProvider(vscode)
  );

  context.subscriptions.push(provider);
}

function createCompletionProvider(vscode) {
  return {
    provideCompletionItems(document, position) {
      const line = document.lineAt(position.line).text;
      const prefix = line.slice(0, position.character);
      const word = prefix.match(/[A-Za-z_]\w*$/)?.[0] ?? "";
      const range = document.getWordRangeAtPosition(position) ??
        new vscode.Range(position, position);
      const hasOpeningParen = line.slice(position.character).startsWith("(");
      const suggestions = [];

      for (const [name, signature, category] of builtinFunctions) {
        const item = new vscode.CompletionItem(
          name,
          vscode.CompletionItemKind.Function
        );
        item.detail = `${signature} · ${category}`;
        item.documentation = new vscode.MarkdownString(
          `iStat built-in function: \`${signature}\``
        );
        item.range = range;
        item.insertText = new vscode.SnippetString(
          `${name}${hasOpeningParen ? "" : "($0)"}`
        );
        suggestions.push(item);
      }

      for (const [name, description] of keywords) {
        const item = new vscode.CompletionItem(
          name,
          vscode.CompletionItemKind.Keyword
        );
        item.detail = description;
        item.range = range;
        item.insertText = name;
        suggestions.push(item);
      }

      const builtins = new Set(builtinFunctions.map(([name]) => name));
      for (const name of findUserSymbols(document.getText())) {
        if (builtins.has(name) || name === "ans") continue;
        const item = new vscode.CompletionItem(
          name,
          vscode.CompletionItemKind.Variable
        );
        item.detail = "iStat variable or user-defined function";
        item.range = range;
        item.insertText = name;
        suggestions.push(item);
      }

      return suggestions.filter((item) =>
        item.label.toLowerCase().startsWith(word.toLowerCase())
      );
    }
  };
}

function deactivate() {}

module.exports = {
  activate,
  createCompletionProvider,
  deactivate,
  findUserSymbols
};
