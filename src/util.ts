export function todo(msg?: string): never {
  throw new Error("TODO: " + msg);
}

export function assert(test: boolean, msg?: string): undefined | never {
  if (!test) {
    throw new Error("ASSERT: " + msg);
  }
}
