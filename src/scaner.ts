export type TokenKind =
  | "number"
  | "plus"
  | "minus"
  | "multiply"
  | "divide"
  | "int"
  | "float"
  | "and"
  | "or"
  | "true"
  | "false"
  | "ident"
  | "equal"
  | "equal_equal"
  | "bang"
  | "or"
  | "and"
  | "not_equal"
  | "greater"
  | "greater_equal"
  | "less"
  | "less_equal"
  | "if"
  | "do"
  | "else"
  | "left_brace"
  | "right_brace"
  | "left_paren"
  | "right_paren"
  | "left_bracket"
  | "right_bracket"
  | "let"
  | "comma"
  | "semicolon"
  | "string"

export type TokenOp = string | number | undefined;

export type Token = {
  line: number;
  kind: TokenKind;
  val: TokenOp;
};

export type Scaner = {
  line: number;
  src: string;
  pos: number;
  start: number;
};

const keywords = new Map<string, TokenKind>([
  ["true", "true"],
  ["false", "false"],
  ["if", "if"],
  ["else", "else"],
  ["do", "do"],
  ["let", "let"],
]);

function is_at_end(s: Scaner): boolean {
  return s.src.length <= s.pos;
}

export function get_tokens(src: string): Token[] {
  const scaner: Scaner = {
    pos: 0,
    line: 1,
    src: src,
    start: 0,
  };

  const tokens: Token[] = [];
  let tok = next_token(scaner);
  while (tok != null) {
    tokens.push(tok);
    tok = next_token(scaner);
  }
  if (tok) {
    tokens.push(tok);
  }

  return tokens;
}

function advance(s: Scaner): string {
  return s.src[s.pos++] || "\0";
}

function peek(s: Scaner): string {
  return s.src[s.pos] || "\0";
}

function peek_next(s: Scaner): string {
  return s.src[s.pos + 1] || "\0";
}

function match(s: Scaner, c: string): boolean {
  if (peek(s) === c) {
    advance(s);
    return true;
  }
  return false;
}

function create_token(
  s: Scaner,
  kind: TokenKind,
  op: TokenOp = undefined,
): Token {
  return { val: op, kind, line: s.line };
}

function skip_whitespaces(s: Scaner) {
  while (!is_at_end(s)) {
    switch (peek(s)) {
      case "/":
        if (peek_next(s) === "/") {
          while (peek(s) !== "\n" && peek(s) !== "\0") {
            advance(s);
          }
          break;
        } else {
          return;
        }
      case "\0":
        return;
      case "\n":
        s.line += 1;
        advance(s);
        break;
      case " ":
      case "\t":
      case "\r":
        advance(s);
        break;
      default:
        return;
    }
  }
}

function is_alpha(c: string): boolean {
  return ("a" <= c && c <= "z") || ("A" <= c && c <= "Z") || c === "_";
}

function is_digit(c: string): boolean {
  return "0" <= c && c <= "9";
}

function get_lexeme(s: Scaner) {
  return s.src.slice(s.start, s.pos);
}

function next_token(s: Scaner): Token | null {
  skip_whitespaces(s);

  if (is_at_end(s)) {
    return null;
  }

  s.start = s.pos;

  const c = advance(s);
  if (is_digit(c)) {
    let is_float = false;
    while (is_digit(peek(s))) {
      advance(s);
    }
    if (peek(s) === ".") {
      is_float = true;
      advance(s);
      while (is_digit(peek(s))) {
        advance(s);
      }
      return create_token(s, "float", parseFloat(get_lexeme(s)));
    }
    return create_token(s, "int", parseInt(get_lexeme(s)));
  }

  if (is_alpha(c)) {
    while (is_alpha(peek(s))) {
      advance(s);
    }
    const lexeme = get_lexeme(s);
    const maybe_keyword = keywords.get(lexeme);
    if (maybe_keyword) {
      return create_token(s, maybe_keyword);
    }
    return create_token(s, "ident", lexeme);
  }

  if (c === '"') {
    while (peek(s) !== '"' && !is_at_end(s)) {
      advance(s);
    }
    if (is_at_end(s)) {
      console.error("unenclosed string");
    }
    advance(s);
    const lex = get_lexeme(s);
    return create_token(s, "string", lex.slice(1, lex.length - 1));
  }

  switch (c) {
    case "=":
      return match(s, "=")
        ? create_token(s, "equal_equal")
        : create_token(s, "equal");
    case "!":
      return match(s, "=")
        ? create_token(s, "not_equal")
        : create_token(s, "bang");
    case ";":
      return create_token(s, "semicolon");
    case "+":
      return create_token(s, "plus");
    case "-":
      return create_token(s, "minus");
    case ",":
      return create_token(s, "comma");
    case "*":
      return create_token(s, "multiply");
    case "/":
      return create_token(s, "divide");
    case "/":
      return create_token(s, "divide");
    case "(":
      return create_token(s, "left_paren");
    case ")":
      return create_token(s, "right_paren");
    case "[":
      return create_token(s, "left_bracket");
    case "]":
      return create_token(s, "right_bracket");
    case "{":
      return create_token(s, "left_brace");
    case "}":
      return create_token(s, "right_brace");
    case "<":
      return match(s, "=")
        ? create_token(s, "less_equal")
        : create_token(s, "less");
    case ">":
      return match(s, "=")
        ? create_token(s, "greater_equal")
        : create_token(s, "greater");
    case "|":
      if (match(s, "|")) return create_token(s, "or");
      break;
    case "&":
      if (match(s, "&")) return create_token(s, "and");
      break;
  }

  console.error("unexpected token '" + c + "'");
  throw new ScanerError();
}

class ScanerError extends Error { }
