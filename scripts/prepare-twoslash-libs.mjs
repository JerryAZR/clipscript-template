// Copies the TypeScript compiler and lib type definitions from
// node_modules/typescript into public/vendor/ts-lib/, so twoslash-cdn
// can serve them locally instead of fetching playgroundcdn.typescriptlang.org
// at render time. Safe to re-run; run after npm install (wired to postinstall).
import fs from "node:fs";
import path from "node:path";

const src = path.resolve("node_modules/typescript/lib");
const dest = path.resolve("public/vendor/ts-lib");

fs.mkdirSync(dest, { recursive: true });

const files = fs
  .readdirSync(src)
  .filter((file) => file === "typescript.js" || file.startsWith("lib."));

for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}

console.log(`Copied ${files.length} TypeScript files to ${dest}`);
