start = expression

// Addition and Subtraction
expression = head:term tail:(_ op:("+" / "-") _ t:term)* {
  return tail.reduce((result, [, op, , t]) => {
    return op === "+" ? result + t : result - t;
  }, head);
}

// Multiplication
term = head:factor tail:(_ "*" _ f:factor)* {
  return tail.reduce((result, [, , , f]) => {
    return result * f;
  }, head);
}

// Parentheses or Numbers
factor = "(" _ expr:expression _ ")" { return expr; }
       / number

// Parse number
number = digits:[0-9]+ {
  return parseInt(digits.join(""), 10);
}

// Optional whitespace (Space, Tab, Newline)
_ = [ \t\n\r]*