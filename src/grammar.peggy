// ==========================================
// MATLAB / Octave-like Peggy Grammar for istat
// ==========================================

{
  function buildBinary(head, tail) {
    return tail.reduce((result, element) => {
      return {
        type: "BinaryExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }
}

Program
  = __ stmts:StatementList? __ {
      return {
        type: "Program",
        body: stmts || []
      };
    }

StatementList
  = head:Statement tail:(StatementSeparator s:Statement { return s; })* StatementSeparator? {
      return [head, ...tail];
    }

StatementSeparator
  = (";" / "," / EOL / [ \t] / Comment)+

Statement
  = stmt:(Assignment / ExpressionStatementWrapper) suppress:(";" { return true; })? {
      return {
        ...stmt,
        suppressOutput: Boolean(suppress)
      };
    }

Assignment
  = id:Identifier _ "=" _ expr:Expression {
      return {
        type: "AssignmentStatement",
        name: id.name,
        value: expr
      };
    }

ExpressionStatementWrapper
  = expr:Expression {
      return {
        type: "ExpressionStatement",
        expression: expr
      };
    }

// --- Expressions Precedence Hierarchy ---

Expression
  = LogicalOr

LogicalOr
  = head:LogicalAnd tail:(_ op:("||" / "|") _ right:LogicalAnd)* {
      return buildBinary(head, tail);
    }

LogicalAnd
  = head:Equality tail:(_ op:("&&" / "&") _ right:Equality)* {
      return buildBinary(head, tail);
    }

Equality
  = head:Relational tail:(_ op:("==" / "!=" / "~=") _ right:Relational)* {
      return buildBinary(head, tail);
    }

Relational
  = head:Range tail:(_ op:("<=" / ">=" / "<" / ">") _ right:Range)* {
      return buildBinary(head, tail);
    }

// Range: 1:10 or 1:2:10
Range
  = start:Additive _ ":" _ step:Additive _ ":" _ end:Additive {
      return {
        type: "RangeExpression",
        start: start,
        step: step,
        end: end
      };
    }
  / start:Additive _ ":" _ end:Additive {
      return {
        type: "RangeExpression",
        start: start,
        end: end
      };
    }
  / Additive

Additive
  = head:Multiplicative tail:(_ op:("+" / "-") _ right:Multiplicative)* {
      return buildBinary(head, tail);
    }

// Note: % is reserved for comments in MATLAB/Octave, mod/rem functions are used for modulo
Multiplicative
  = head:Power tail:(_ op:(".*" / "./" / "*" / "/") _ right:Power)* {
      return buildBinary(head, tail);
    }

Power
  = head:Unary tail:(_ op:(".^" / "^") _ right:Unary)* {
      return buildBinary(head, tail);
    }

Unary
  = op:("-" / "+" / "~" / "!") _ arg:Unary {
      return {
        type: "UnaryExpression",
        operator: op,
        argument: arg
      };
    }
  / Postfix

Postfix
  = primary:Primary modifiers:PostfixModifier* {
      return modifiers.reduce((acc, mod) => {
        if (mod.type === "call") {
          return {
            type: "CallExpression",
            callee: acc,
            args: mod.args
          };
        } else if (mod.type === "index") {
          return {
            type: "IndexExpression",
            object: acc,
            index: mod.index
          };
        } else if (mod.type === "property") {
          return {
            type: "PropertyAccess",
            object: acc,
            property: mod.property
          };
        }
        return acc;
      }, primary);
    }

PostfixModifier
  = "(" __ args:ArgumentList? __ ")" {
      return { type: "call", args: args || [] };
    }
  / "[" __ idx:ArgumentList __ "]" {
      return { type: "index", index: idx };
    }
  / "." prop:IdentifierName {
      return { type: "property", property: prop };
    }

Primary
  = FunctionCallDirect
  / ArrayLiteral
  / GroupedExpression
  / NumberLiteral
  / StringLiteral
  / BooleanLiteral
  / Identifier

FunctionCallDirect
  = id:Identifier _ "(" __ args:ArgumentList? __ ")" {
      return {
        type: "CallExpression",
        callee: id,
        args: args || []
      };
    }

ArgumentList
  = head:Expression tail:(__ ("," / _) __ e:Expression)* {
      const list = [head];
      for (const t of tail) {
        list.push(t[3]);
      }
      return list;
    }

GroupedExpression
  = "(" __ expr:Expression __ ")" { return expr; }

// Arrays and 2D Matrices: [1, 2, 3] or [1 2 3] or [1 2; 3 4]
ArrayLiteral
  = "[" __ rows:MatrixRows? __ "]" {
      return {
        type: "ArrayLiteral",
        rows: rows || []
      };
    }

MatrixRows
  = head:MatrixRow tail:(__ (";" / EOL+) __ r:MatrixRow)* {
      const list = [head];
      for (const t of tail) {
        list.push(t[3]);
      }
      return list;
    }

MatrixRow
  = head:Expression tail:RowElement* {
      return [head, ...tail];
    }

RowElement
  = ("," _ / [ \t]+) expr:Expression {
      return expr;
    }

NumberLiteral
  = n:FloatNumber { return { type: "NumberLiteral", value: n }; }

FloatNumber "number"
  = digits:("-"? ([0-9]+ ("." [0-9]+)? / "." [0-9]+) ([eE] [+-]? [0-9]+)?) {
      return parseFloat(text());
    }

StringLiteral "string"
  = "'" chars:([^'\\] / "\\" .)* "'" {
      return {
        type: "StringLiteral",
        value: chars.map(c => typeof c === "string" ? c : c.join("")).join("")
      };
    }
  / '"' chars:([^"\\] / "\\" .)* '"' {
      return {
        type: "StringLiteral",
        value: chars.map(c => typeof c === "string" ? c : c.join("")).join("")
      };
    }

BooleanLiteral "boolean"
  = "true" { return { type: "BooleanLiteral", value: true }; }
  / "false" { return { type: "BooleanLiteral", value: false }; }

Identifier
  = name:IdentifierName {
      return { type: "Identifier", name: name };
    }

IdentifierName
  = !Keyword [a-zA-Z_][a-zA-Z0-9_]* { return text(); }

Keyword
  = ("true" / "false") ![a-zA-Z0-9_]

// --- Whitespace & Comments ---

_ "inline_whitespace"
  = [ \t]*

__ "multiline_whitespace"
  = (Whitespace / Comment)*

Whitespace
  = [ \t\r\n]

EOL
  = [\r\n]

Comment
  = "%" [^\r\n]*
  / "//" [^\r\n]*
  / "#" [^\r\n]*
  / "/*" (!"*/" .)* "*/"
