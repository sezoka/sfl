import type { Node } from "./parser";
import { todo } from "./util";

type Backend = {
  buff: string[];
};

export function generate(stmts: Node[]) {
  const back: Backend = {
    buff: [],
  };
  for (const stmt of stmts) {
    generate_node(back, stmt);
    append(back, "\n");
  }

  return back.buff.join("");
}

function generate_node(b: Backend, node: Node) {
  switch (node.kind) {
    case "literal":
      switch (node.val.kind) {
        case "int":
          b.buff.push(node.val.val.toString());
          break;
        case "float":
          b.buff.push(node.val.val.toString());
          break;
        case "bool":
          b.buff.push(node.val.val.toString());
          break;
      }
      break;
    case "binary":
      generate_node(b, node.val.left);
      switch (node.val.op) {
        case "plus":
          append(b, " + ");
          break;
        case "minus":
          append(b, " - ");
          break;
        case "multiply":
          append(b, "*");
          break;
        case "divide":
          append(b, "/");
          break;
        case "greater":
          append(b, " > ");
          break;
        case "greater_equal":
          append(b, " >= ");
          break;
        case "less":
          append(b, " < ");
          break;
        case "less_equal":
          append(b, " <= ");
          break;
        case "equal":
          append(b, " === ");
          break;
        case "not_equal":
          append(b, " !== ");
          break;
        case "and":
          append(b, " && ");
          break;
        case "or":
          append(b, " || ");
          break;
      }
      generate_node(b, node.val.right);
      break;
    case "grouping":
      append(b, "(");
      generate_node(b, node.val.expr);
      append(b, ")");
      break;
    case "expr_stmt":
      generate_node(b, node.val.expr);
      append(b, ";");
      break;
    case "block":
      append(b, "{");
      for (const stmt of node.val.stmts) {
        generate_node(b, stmt);
      }
      append(b, "}");
      break;
    case "if":
      const if_ = node.val;
      if (if_.is_expr) {
        append(b, "(");
        generate_node(b, if_.cond);
        append(b, ") ? (");
        generate_node(b, if_.then);
        append(b, ") : (");
        generate_node(b, if_.else_!);
        append(b, ")");
      } else {
        append(b, "if (");
        generate_node(b, if_.cond);
        append(b, ") ");
        generate_node(b, if_.then);
        if (if_.else_) {
          append(b, " else ");
          generate_node(b, if_.else_!);
        }
      }
      break;
    case "ident":
      append(b, node.val);
      break;
    case "let":
      const let_ = node.val;
      append(b, "var ");
      append(b, let_.name);
      append(b, " = ");
      generate_node(b, let_.init_expr);
      append(b, ";");
      break;
    default:
      throw new Error("HUY");
  }
}

function append(b: Backend, str: string) {
  b.buff.push(str);
}
