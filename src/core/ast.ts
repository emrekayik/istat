// ==========================================
// AST (Abstract Syntax Tree) Definitions
// ==========================================

export type Node = Program | Statement | Expression;

export interface Program {
  type: "Program";
  body: Statement[];
}

export type Statement =
  | AssignmentStatement
  | ExpressionStatement
  | IfStatement
  | ForStatement
  | WhileStatement
  | BreakStatement
  | ContinueStatement;

export interface AssignmentStatement {
  type: "AssignmentStatement";
  name: string;
  value: Expression;
  suppressOutput: boolean;
}

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: Expression;
  suppressOutput: boolean;
}

export interface IfStatement {
  type: "IfStatement";
  test: Expression;
  consequent: Statement[];
  alternate?: Statement[];
}

export interface ForStatement {
  type: "ForStatement";
  variable: string;
  iterable: Expression;
  body: Statement[];
}

export interface WhileStatement {
  type: "WhileStatement";
  test: Expression;
  body: Statement[];
}

export interface BreakStatement {
  type: "BreakStatement";
}

export interface ContinueStatement {
  type: "ContinueStatement";
}

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | RangeExpression
  | ArrayLiteral
  | CallExpression
  | Identifier
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | IndexExpression
  | PropertyAccess;

export interface BinaryExpression {
  type: "BinaryExpression";
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: "UnaryExpression";
  operator: string;
  argument: Expression;
}

export interface RangeExpression {
  type: "RangeExpression";
  start: Expression;
  step?: Expression;
  end: Expression;
}

export interface ArrayLiteral {
  type: "ArrayLiteral";
  rows: Expression[][]; // Supports 1D ([1, 2, 3]) and 2D matrices ([1, 2; 3, 4])
}

export interface CallExpression {
  type: "CallExpression";
  callee: Expression;
  args: Expression[];
}

export interface Identifier {
  type: "Identifier";
  name: string;
}

export interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
}

export interface StringLiteral {
  type: "StringLiteral";
  value: string;
}

export interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
}

export interface IndexExpression {
  type: "IndexExpression";
  object: Expression;
  index: Expression[];
}

export interface PropertyAccess {
  type: "PropertyAccess";
  object: Expression;
  property: string;
}
