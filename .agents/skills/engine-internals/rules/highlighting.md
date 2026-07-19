# Highlighting and twoslash

## Pre-highlighting (`src/engine/highlight.ts`)

All highlighting happens in `calculateMetadata` - `highlight()` from
`codehike/code` is async and must never run during render. Every code step of
every code clip (including chain carry-ins) is fetched from
`public/<episode>/code/`, language inferred from extension, and highlighted
with the episode's theme. Results flow via `HighlightContext` as
`Record<stepSrc, HighlightedCode>`.

## twoslash (`src/calculate-metadata/process-snippet.ts`)

ts/tsx files first run through twoslash (a real TypeScript compiler) for:

- `// ^?` type queries -> `callout` annotations with a highlighted type block
- compiler errors -> `error` annotations

twoslash runs fully offline on `twoslash` core (`createTwoslasher`):
`scripts/prepare-twoslash-libs.mjs` (wired to `postinstall`) copies the
compiler's lib types from `node_modules/typescript` into
`public/vendor/ts-lib/` (gitignored, ~12MB) plus a `files.json` manifest.
`process-snippet.ts` lazily loads that manifest + lib files into a virtual
`fsMap` once per render process. There is deliberately no npm type
acquisition (ATA) - a snippet importing an npm package renders "cannot find
module" error annotations, loud and offline. Re-add `@typescript/ata` if
that ever becomes a real need.

## Offline lighter (`remotion.config.ts`)

`@code-hike/lighter`'s browser build fetches themes and grammars from
lighter.codehike.org per render. The webpack config aliases
`@code-hike/lighter` to its node build (`dist/index.esm.mjs`), which loads
the same files from its own dist/ via literal dynamic imports - fully
offline. The node build's network fallback dynamically imports the `https`
builtin, stubbed via `resolve.fallback: { https: false }`. In vitest (node
condition) the node build is used natively, so tests exercise the same code.

## Annotation extraction

`highlight()` strips annotation comments before highlighting; line numbers in
annotations are relative to the comment line, 1-based, and re-based after
comment removal. The `[/regex/]` range form is silently dropped by
`@code-hike/lighter@1.0.3` - only `[cols]` and `(lines)` ranges work.

Unknown languages fall back to plain text with a console warning.
