import type { Token, TokenKind } from "./scaner";

type Parser = {
  tokens: Token[];
  pos: number;
};

type NodeBase =
  | { kind: "literal"; val: LiteralExp }
  | { kind: "binary"; val: BinaryExpr }
  | { kind: "expr_stmt"; val: ExprStmt }
  | { kind: "grouping"; val: GroupingExpr }
  | { kind: "if"; val: IfExprStmt }
  | { kind: "ident"; val: IdentExpr }
  | { kind: "let"; val: LetExpr }
  | { kind: "block"; val: BlockStmt };

type LetExpr = {
  init_expr: Node;
  name: string;
};

type IfExprStmt = {
  cond: Node;
  then: Node;
  else_: Node | null;
  is_expr: boolean;
};

type IdentExpr = string;

type BlockStmt = {
  stmts: Node[];
};

export type Node = NodeBase & { line: number };

export type GroupingExpr = {
  expr: Node;
};

export type LiteralExp =
  | { kind: "int"; val: number }
  | { kind: "float"; val: number }
  | { kind: "bool"; val: boolean };

export type BinaryExpr = {
  left: Node;
  op: BinOp;
  right: Node;
};

export type ExprStmt = {
  expr: Node;
};

type BinOp =
  | "plus"
  | "minus"
  | "multiply"
  | "divide"
  | "greater"
  | "greater_equal"
  | "less"
  | "less_equal"
  | "equal"
  | "bang"
  | "not_equal"
  | "and"
  | "or";

function next(p: Parser): Token {
  const tok = p.tokens[p.pos++];
  if (!tok) {
    error(p, "unexpected end of file");
  }
  return tok;
}

function peek(p: Parser) {
  const tok = p.tokens[p.pos];
  if (!tok) {
    error(p, "unexpected end of file");
  }
  return tok;
}

function peek_prev(p: Parser) {
  const tok = p.tokens[p.pos - 1];
  if (!tok) {
    error(p, "unexpected end of file");
  }
  return tok;
}

function is_at_end(p: Parser): boolean {
  return p.tokens.length <= p.pos;
}

export function parse(tokens: Token[]): Node[] | null {
  const parser = {
    tokens: tokens,
    pos: 0,
  };

  const statements = [];
  while (!is_at_end(parser)) {
    try {
      const statement = parse_statement(parser);
      statements.push(statement);
    } catch (e) {
      throw e;
    }
  }

  return statements;
}

function parse_statement(p: Parser): Node {
  if (peek(p).kind === "left_brace") {
    next(p);
    const stmts: Node[] = [];
    while (peek(p).kind !== "right_brace") {
      stmts.push(parse_statement(p));
    }
    expect(p, "right_brace");
    return create_node(p, { kind: "block", val: { stmts } });
  }

  if (peek(p).kind === "if") {
    next(p);
    const cond = parse_expression(p);

    let is_expr = false;
    if (peek(p).kind !== "left_brace") {
      expect(p, "do");
      is_expr = true;
    }
    const then = is_expr ? parse_expression(p) : parse_statement(p);
    let else_: Node | null = null;
    if (!is_at_end(p) && peek(p).kind === "else") {
      next(p);
      else_ = is_expr ? parse_expression(p) : parse_statement(p);
    } else {
      is_expr = false;
    }

    const if_node = create_node(p, {
      kind: "if",
      val: { cond, then, else_, is_expr },
    });
    if (is_expr) {
      return create_node(p, { kind: "expr_stmt", val: { expr: if_node } });
    } else {
      return if_node;
    }
  }

  if (peek(p).kind === "let") {
    next(p);
    const ident = expect(p, "ident");
    console.log(">>>", ident)
    const name = ident?.val as string || "";
    expect(p, "equal");
    const init_expr = parse_expression(p);
    expect(p, "semicolon");
    return create_node(p, { kind: "let", val: { init_expr, name } });
  }

  const expr = parse_expression(p);

  expect(p, "semicolon");

  return create_node(p, { kind: "expr_stmt", val: { expr: expr } });
}

function parse_expression(p: Parser): Node {
  return parse_or(p);
}

function parse_or(p: Parser): Node {
  let left = parse_and(p);

  while (!is_at_end(p) && peek(p).kind === "or") {
    next(p);
    const right = parse_and(p);
    left = create_node(p, {
      kind: "binary",
      val: {
        left: left,
        op: "or",
        right: right,
      },
    });
  }

  return left;
}

function parse_and(p: Parser): Node {
  let left = parse_equality(p);

  while (!is_at_end(p) && peek(p).kind === "and") {
    next(p);
    const right = parse_equality(p);
    left = create_node(p, {
      kind: "binary",
      val: {
        left: left,
        op: "and",
        right: right,
      },
    });
  }

  return left;
}

function parse_equality(p: Parser): Node {
  let left = parse_comparison(p);

  while (!is_at_end(p) && ["equal_equal", "not_equal"].includes(peek(p).kind)) {
    const op = next(p).kind;
    const right = parse_comparison(p);
    left = create_node(p, {
      kind: "binary",
      val: {
        left: left,
        op: op === "equal_equal" ? "equal" : "not_equal",
        right: right,
      },
    });
  }

  return left;
}

function parse_comparison(p: Parser): Node {
  let left = parse_plus(p);

  while (
    !is_at_end(p) &&
    ["less", "less_equal", "greater", "greater_equal"].includes(peek(p).kind)
  ) {
    const op = next(p).kind;
    const right = parse_plus(p);
    left = create_node(p, {
      kind: "binary",
      val: {
        left: left,
        op: op as BinOp,
        right: right,
      },
    });
  }

  return left;
}

function parse_plus(p: Parser): Node {
  let left = parse_mult(p);

  while (!is_at_end(p) && ["plus", "minus"].includes(peek(p).kind)) {
    const op = next(p).kind;
    if (op !== "plus" && op !== "minus") unreachable();
    const right = parse_mult(p);
    left = create_node(p, {
      kind: "binary",
      val: {
        left: left,
        op: op,
        right: right,
      },
    });
  }

  return left;
}

function parse_mult(p: Parser): Node {
  let left = parse_primary(p);

  while (!is_at_end(p) && ["multiply", "divide"].includes(peek(p).kind)) {
    const op = next(p).kind;
    if (op !== "multiply" && op !== "divide") unreachable();
    const right = parse_primary(p);
    left = create_node(p, {
      kind: "binary",
      val: {
        left: left,
        op: op,
        right: right,
      },
    });
  }

  return left;
}

function parse_primary(p: Parser): Node {
  const tok = next(p);

  switch (tok.kind) {
    case "int":
      return create_node(p, {
        kind: "literal",
        val: { kind: "int", val: tok.val as number },
      });
    case "float":
      return create_node(p, {
        kind: "literal",
        val: { kind: "float", val: tok.val as number },
      });
    case "true":
      return create_node(p, {
        kind: "literal",
        val: { kind: "bool", val: true },
      });
    case "false":
      return create_node(p, {
        kind: "literal",
        val: { kind: "bool", val: false },
      });
    case "left_paren":
      const expr = parse_expression(p);
      expect(p, "right_paren");
      return create_node(p, {
        kind: "grouping",
        val: { expr },
      });
    case "ident":
      return create_node(p, { kind: "ident", val: tok.val as string })
  }

  error(p, "unexpected token '" + tok.kind + "'");
}

function expect(p: Parser, tok: TokenKind): Token | never {
  if (peek(p).kind === tok) {
    return next(p);
  }
  error(p, `expect '${tok}', but got '${peek(p).kind}'`);
}

function create_node(p: Parser, base: NodeBase): Node {
  return { line: peek_prev(p).line, ...base };
}

function unreachable(): never {
  throw ParseError;
}

function error(p: Parser, ...something: any): never {
  if (is_at_end(p)) {
    console.error(`[EOF]:`, ...something);
  } else {
    console.error(`[${peek(p).line}]:`, ...something);
  }
  throw ParseError;
}

class ParseError extends Error { }
