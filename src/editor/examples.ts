export interface EditorExample {
  id: string;
  title: string;
  category: string;
  code: string;
}

export const editorExamples: EditorExample[] = [
  {
    id: "statistics",
    title: "Descriptive statistics",
    category: "Statistics",
    code: `data = [2, 4, 4, 4, 5, 5, 7, 9];

average = mean(data);
middle = median(data);
sampleVariance = variance(data);
varianceAlias = var(data);
sampleDeviation = stdev(data);
deviationAlias = std(data);
middleQuantile = quantile(data, 0.5);
report = summary(data);
frequent = mode(data);
asymmetry = skewness(data);
tailWeight = kurtosis(data);
standardized = zscore(data);
covariances = covarianceMatrix([1 2; 2 4; 3 5]);
bins = histogram(data, 4);
sameBins = hist(data, 4);`,
  },
  {
    id: "matrices",
    title: "Matrices and linear algebra",
    category: "Matrices",
    code: `A = [4 1; 2 3];
B = [1 2; 3 4];

transposed = transpose(A);
product = matmul(A, B);
vectorDot = dot([1, 2], [3, 4]);
identity = eye(2);
diagonalMatrix = diag([5, 6]);
mainDiagonal = diag(A);
matrixTrace = trace(A);
determinant = det(A);
inverse = inv(A);
solution = solve(A, [9, 8]);
square = A ^ 2;`,
  },
  {
    id: "probability",
    title: "Probability distributions",
    category: "Probability",
    code: `normalDensity = normalPdf(0);
normalProbability = normalCdf(1.96);
binomialMass = binomialPmf(2, 5, 0.5);
binomialProbability = binomialCdf(2, 5, 0.5);
poissonMass = poissonPmf(2, 3);
poissonProbability = poissonCdf(2, 3);
uniformDensity = uniformPdf(0.25, 0, 2);
uniformProbability = uniformCdf(0.25, 0, 2);`,
  },
  {
    id: "models",
    title: "Correlation and regression",
    category: "Models",
    code: `x = [1, 2, 3, 4, 5];
y = [5, 7, 9, 11, 13];

covarianceValue = covariance(x, y);
covAlias = cov(x, y);
correlation = pearson(x, y);
correlationAlias = corr(x, y);
rankCorrelation = spearman(x, y);
line = linreg(x, y);
lineAlias = linearRegression(x, y);
prediction = line.predict(6);
polynomial = polyfit(x, y, 1);
polynomialAlias = polyreg(x, y, 1);`,
  },
  {
    id: "import",
    title: "CSV, XLSX and JSON import",
    category: "Data",
    code: `csvRows = readData("examples/measurements.csv");
scores = column(csvRows, "score");
csvWithoutHeaders = readCsv("examples/measurements.csv", false);

jsonRows = readJson("examples/records.json");
jsonScores = column(jsonRows, "score");

workbookRows = readXlsx("examples/measurements.xlsx", "Scores");
workbookScores = column(workbookRows, "score");
workbookWithoutHeaders = readXlsx("examples/measurements.xlsx", 0, false);

averageScore = mean(scores);
jsonAverage = mean(jsonScores);
workbookAverage = mean(workbookScores);`,
  },
  {
    id: "utilities",
    title: "Arrays, sorting and math",
    category: "Utilities",
    code: `values = [1.2, 2.5, 3.8, 4.1];

total = sum(values);
minimum = min(values);
maximum = max(values);
count = length(values);
dimensions = size(values);
zeroVector = zeros(4);
zeroMatrix = zeros(2, 3);
oneVector = ones(4);
oneMatrix = ones(2, 3);
evenlySpaced = linspace(0, 1, 5);
modulo = mod(-7, 3);
remainder = rem(-7, 3);
ascending = sort(values);
selected = quickselect(values, 2);

roots = sqrt(values);
magnitudes = abs([-2, 0, 2]);
sines = sin(values);
cosines = cos(values);
tangents = tan(values);
naturalLogs = log(values);
decimalLogs = log10(values);
binaryLogs = log2(values);
exponentials = exp(values);
rounded = round(values);
floored = floor(values);
ceiled = ceil(values);`,
  },
  {
    id: "control-flow",
    title: "Functions, loops and conditions",
    category: "Language",
    code: `data = 1:10;
runningTotal = 0;
for value = data
  if value == 4
    continue;
  end
  if value == 8
    break;
  end
  runningTotal = runningTotal + value;
end

result = centeredMean([2, 4, 6, 8]);

function output = centeredMean(values)
  output = mean(values) - median(values);
end`,
  },
  {
    id: "timing",
    title: "Timing and benchmarking",
    category: "Performance",
    code: `started = tic();
elapsedSeconds = toc(started);
highResolutionTime = now();
measurements = benchmark(workload, 100, 5);

function output = workload()
  output = mean(1:1000);
end`,
  },
  {
    id: "charts",
    title: "Charts and output",
    category: "Charts",
    code: `observed = [1, 2, 2, 3, 3, 3, 4, 5];
histogramSvg = plotHist(observed, 4, "Sample distribution");
scatterSvg = scatter([1, 2, 3], [2, 4, 5], "Sample observations");
disp("Histogram SVG characters:", length(histogramSvg));
% Uncomment to save a chart in the current working directory:
% savedFile = saveSvg("histogram.svg", histogramSvg);`,
  },
];
