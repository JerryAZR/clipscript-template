# Highlighting

## Pre-highlighting (`src/engine/highlight.ts`)

All highlighting happens in `calculateMetadata` - `highlight()` from
`codehike/code` is async and must never run during render. Every code step of
every code clip (including chain carry-ins) is fetched from
`public/<episode>/code/`, language inferred from extension, and highlighted
with the episode's theme. Results flow via `HighlightContext` as
`Record<stepSrc, HighlightedCode>`.

Highlighting is pure syntax highlighting (TextMate grammars via
`@code-hike/lighter`) - no semantic layer. twoslash was dropped: it only
ever served ts/tsx type callouts and error squiggles, unused by real
episodes, at the cost of a 12MB vendored compiler lib set. If type
callouts or compiler-error annotations are ever needed again, the old
implementation is in git history (`process-snippet.ts` before the drop).

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
