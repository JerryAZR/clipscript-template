// Copies the TypeScript lib type definitions from node_modules/typescript
// into public/vendor/ts-lib/, so twoslash can load them locally at render
// time instead of fetching a CDN. Safe to re-run; run after npm install
// (wired to postinstall).
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

// Manifest of what is available; src/calculate-metadata/process-snippet.ts
// fetches it to know which lib files to load into twoslash's virtual FS.
fs.writeFileSync(
  path.join(dest, "files.json"),
  JSON.stringify(files, null, 2) + "\n",
);

console.log(`Copied ${files.length} TypeScript files to ${dest}`);
