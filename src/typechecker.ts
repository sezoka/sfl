import type { Node } from "./parser";

export type Variable = {
  name: string;
  is_const: boolean;
  type_: ValueType;
};

type Scope = {
  enclosing: Scope | null;
  names: Map<string, Variable>;
};

type Checker = {
  scopes: Scope[];
};

type ValueType =
  | { kind: "int" }
  | { kind: "float" }
  | { kind: "bool" }
  | { kind: "void" };

function create_scope(enclosing: Scope | null = null): Scope {
  return {
    names: new Map(),
    enclosing,
  };
}

export function check(stmts: Node[]) {
  const checker: Checker = {
    scopes: [create_scope()],
  };
  for (const stmt of stmts) {
    check_node(checker, stmt);
  }
}

function check_node(c: Checker, node: Node): ValueType {
  switch (node.kind) {
    case "binary":
      const binary = node.val;
      const left = check_node(c, binary.left);
      const right = check_node(c, binary.right);

      switch (binary.op) {
        case "plus":
        case "minus":
        case "multiply":
        case "divide": {
          if (
            (left.kind === "int" || left.kind === "float") &&
            left.kind === right.kind
          ) {
            return { kind: left.kind };
          }
          error("both operands should be ints of floats");
        }
        case "equal":
        case "not_equal": {
          if (left.kind === right.kind) {
            return { kind: "bool" };
          }
          error("both operands should have the same type");
        }
        case "greater":
        case "greater_equal":
        case "less":
        case "less_equal": {
          if (
            (left.kind === "int" || left.kind === "float") &&
            left.kind === right.kind
          ) {
            return { kind: "bool" };
          }
          error("both operands should be ints of floats");
        }
        case "and":
        case "or":
          if (left.kind === "bool" && left.kind === right.kind) {
            return { kind: "bool" };
          }
          error("both operands should be booleans");
      }
      error("unknown binary expression");
    case "literal":
      const literal = node.val;
      return { kind: literal.kind };
    case "grouping":
      const grouping = node.val;
      return check_node(c, grouping.expr);
    case "expr_stmt":
      const expr_stmt = node.val;
      return check_node(c, expr_stmt.expr);
    case "block":
      const block = node.val;
      for (const stmt of block.stmts) {
        check_node(c, stmt);
      }
      return { kind: "void" };
    case "if":
      const if_ = node.val;
      const cond = check_node(c, if_.cond);
      if (cond.kind !== "bool") {
        error("condition of if expr should be of type 'bool'");
      }
      const then = check_node(c, if_.then);
      const else_ = if_.else_ ? check_node(c, if_.else_) : null;
      if (if_.is_expr) {
        if (then.kind !== else_?.kind) {
          error("both branches of if expr should have same type");
        }
        return { kind: then.kind };
      }
      return { kind: "void" };
    case "let":
      const let_ = node.val;
      const init_type = check_node(c, let_.init_expr);
      add_var(c, let_.name, init_type);
      return { kind: "void" };
    case "ident":
      const ident = node.val;
      return get_var(c, ident).type_;

  }
}

function get_var(c: Checker, name: string): Variable {
  const var_ = c.scopes[c.scopes.length - 1].names.get(name);
  if (!var_) {
    error(`undefined variable '${name}'`);
  }
  return var_;
}

function add_var(c: Checker, name: string, init_type: ValueType) {
  const scope = c.scopes[c.scopes.length - 1];
  if (scope.names.has(name)) {
    error("variable with name '" + name + "' already exists in this scope");
  }
  const variable: Variable = { name, type_: init_type, is_const: false };
  scope.names.set(name, variable);
}

function error(...something: any): never {
  console.error(...something);
  throw TypeError;
}

class TypeError extends Error { }
