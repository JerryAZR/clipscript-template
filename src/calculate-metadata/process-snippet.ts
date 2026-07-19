import { highlight } from "codehike/code";
import { staticFile } from "remotion";
import { createTwoslasher } from "twoslash";
import ts, { CompilerOptions, JsxEmit, ModuleKind, ScriptTarget } from "typescript";
import { PublicFolderFile } from "./get-files";
import { Theme } from "./theme";

const compilerOptions: CompilerOptions = {
  lib: ["dom", "es2023"],
  jsx: JsxEmit.ReactJSX,
  target: ScriptTarget.ES2023,
  module: ModuleKind.ESNext,
};

// twoslash needs a virtual FS holding the TypeScript compiler's lib files.
// We build it from public/vendor/ts-lib/, which scripts/prepare-twoslash-libs.mjs
// (wired to postinstall) copies from node_modules/typescript - no playground
// CDN involved. There is deliberately no npm type acquisition: a snippet
// importing an npm package renders "cannot find module" error annotations,
// loud and offline. Re-add @typescript/ata if that ever becomes a real need.
let twoslasherPromise: Promise<ReturnType<typeof createTwoslasher>> | null =
  null;

const getTwoslasher = () => {
  twoslasherPromise ??= (async () => {
    const manifestResp = await fetch(staticFile("vendor/ts-lib/files.json"));
    if (!manifestResp.ok) {
      throw new Error(
        `ts-lib manifest not found (${manifestResp.status}) - run scripts/prepare-twoslash-libs.mjs`,
      );
    }
    const files = (await manifestResp.json()) as string[];
    const fsMap = new Map<string, string>();
    await Promise.all(
      files.map(async (file) => {
        const resp = await fetch(staticFile(`vendor/ts-lib/${file}`));
        if (!resp.ok) {
          throw new Error(`ts-lib file failed to load: ${file} (${resp.status})`);
        }
        fsMap.set(`/${file}`, await resp.text());
      }),
    );
    return createTwoslasher({ tsModule: ts, fsMap });
  })();
  return twoslasherPromise;
};

export const processSnippet = async (step: PublicFolderFile, theme: Theme) => {
  const splitted = step.filename.split(".");
  const extension = splitted[splitted.length - 1];

  const twoslashResult =
    extension === "ts" || extension === "tsx"
      ? (await getTwoslasher())(step.value, extension, {
          compilerOptions,
        })
      : null;

  const highlighted = await highlight(
    {
      lang: extension,
      meta: step.filename,
      value: twoslashResult ? twoslashResult.code : step.value,
    },
    theme,
  );

  if (!twoslashResult) {
    return highlighted;
  }

  // If it is TypeScript code, let's also generate callouts (^?) and errors
  for (const { text, line, character, length } of twoslashResult.queries) {
    const codeblock = await highlight(
      { value: text, lang: "ts", meta: "callout" },
      theme,
    );
    highlighted.annotations.push({
      name: "callout",
      query: text,
      lineNumber: line + 1,
      data: {
        character,
        codeblock,
      },
      fromColumn: character,
      toColumn: character + length,
    });
  }

  for (const { text, line, character, length } of twoslashResult.errors) {
    highlighted.annotations.push({
      name: "error",
      query: text,
      lineNumber: line + 1,
      data: { character },
      fromColumn: character,
      toColumn: character + length,
    });
  }

  return highlighted;
};
