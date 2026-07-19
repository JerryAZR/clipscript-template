import { highlight } from "codehike/code";
import { staticFile } from "remotion";
import { createTwoslashFromCDN } from "twoslash-cdn";
import { CompilerOptions, JsxEmit, ModuleKind, ScriptTarget } from "typescript";
import { PublicFolderFile } from "./get-files";
import { Theme } from "./theme";

const compilerOptions: CompilerOptions = {
  lib: ["dom", "es2023"],
  jsx: JsxEmit.ReactJSX,
  target: ScriptTarget.ES2023,
  module: ModuleKind.ESNext,
};

// twoslash-cdn downloads the TypeScript compiler and lib types from
// playgroundcdn.typescriptlang.org at runtime. We serve them locally instead:
// scripts/prepare-twoslash-libs.mjs copies them from node_modules/typescript
// into public/vendor/ts-lib/ (wired to postinstall). Anything that is not a
// compiler/lib file (e.g. ATA type acquisition for npm imports) still goes
// to the network.
const CDN_LIB_PATTERN = /\/cdn\/[^/]+\/typescript\/lib\/(.+)$/;

const localLibFetcher: typeof fetch = (input, init) => {
  const url = typeof input === "string" ? input : String(input);
  const match = url.match(CDN_LIB_PATTERN);
  if (match) {
    return fetch(staticFile(`vendor/ts-lib/${match[1]}`), init);
  }
  return fetch(input, init);
};

const twoslash = createTwoslashFromCDN({
  compilerOptions,
  fetcher: localLibFetcher,
});

export const processSnippet = async (step: PublicFolderFile, theme: Theme) => {
  const splitted = step.filename.split(".");
  const extension = splitted[splitted.length - 1];

  const twoslashResult =
    extension === "ts" || extension === "tsx"
      ? await twoslash.run(step.value, extension, {
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
