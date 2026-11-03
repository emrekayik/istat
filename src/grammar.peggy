start = expression

// Toplama ve Çıkarma
expression = head:term tail:(_ op:("+" / "-") _ t:term)* {
  return tail.reduce((result, [, op, , t]) => {
    return op === "+" ? result + t : result - t;
  }, head);
}

// Çarpma
term = head:factor tail:(_ "*" _ f:factor)* {
  return tail.reduce((result, [, , , f]) => {
    return result * f;
  }, head);
}

// Parantezler veya Sayılar
factor = "(" _ expr:expression _ ")" { return expr; }
       / number

// Sayı okuma
number = digits:[0-9]+ {
  return parseInt(digits.join(""), 10);
}

// İsteğe bağlı boşluklar (Space, Tab, Newline)
_ = [ \t\n\r]*