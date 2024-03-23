import * as scaner from "./scaner";
import * as parser from "./parser";
import * as backend from "./backend";
import * as typechecker from "./typechecker";

async function main() {
  const args = Bun.argv;
  const file = args[2];

  if (!file) {
    console.error("Expect file path but got nothing :(");
    return;
  }

  const src = await Bun.file(args[2])
    .text()
    .catch((_) => null);
  if (!src) {
    console.error("cant open file " + args[2]);
    return;
  }

  const tokens = scaner.get_tokens(src);
  const ast = parser.parse(tokens);
  if (!ast) {
    return;
  }
  typechecker.check(ast);
  const out = backend.generate(ast);
  console.debug(out);
  console.log(eval(out));
}

main();
