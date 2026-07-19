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

twoslash runs locally, not from the playground CDN:
`scripts/prepare-twoslash-libs.mjs` (wired to `postinstall`) copies the
compiler + lib types from `node_modules/typescript` into
`public/vendor/ts-lib/` (gitignored, ~12MB), and a custom `fetcher` in
`process-snippet.ts` rewrites `/cdn/*/typescript/lib/*` URLs to `staticFile`.
Only ATA type-acquisition for npm imports in snippets would still touch the
network.

## Annotation extraction

`highlight()` strips annotation comments before highlighting; line numbers in
annotations are relative to the comment line, 1-based, and re-based after
comment removal. The `[/regex/]` range form is silently dropped by
`@code-hike/lighter@1.0.3` - only `[cols]` and `(lines)` ranges work.

Unknown languages fall back to plain text with a console warning.
