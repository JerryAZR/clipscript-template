---
name: codehike-video
description: Authoring code tutorial/dev-log videos with Code Hike in this Remotion template - code steps, annotations, token transitions
metadata:
  tags: codehike, remotion, code, annotations, token-transitions, twoslash
---

## When to use

Use this skill whenever you create or edit code steps (`public/<episode>/`), annotations (`src/annotations/`), or the transition/layout plumbing of this template.

## How this template works

An **episode** is a folder under `public/` (e.g. `public/codehike-demo/`). Every file directly inside the episode folder becomes one step of the video, ordered by file name (natural sort: `code2` before `code10`). The `episode` composition prop selects which folder is rendered - to add another episode, create a new folder and a new `<Composition>` in `src/Root.tsx` with a different `episode` in `defaultProps`. The pipeline:

1. `src/calculate-metadata/get-files.ts` reads the episode's step files via `getStaticFiles()`.
2. `src/calculate-metadata/process-snippet.ts` runs twoslash (TS/TSX only, for `^?` type queries and compiler errors) and then `highlight()` from `codehike/code`. The file name is stored in `meta`.
3. `src/calculate-metadata/calculate-metadata.tsx` measures the widest line to size the composition and sets `durationInFrames = steps * 90`.
4. `src/Main.tsx` renders the steps as a `<Series>`, 90 frames each.
5. `src/CodeTransition.tsx` renders each step with `<Pre>` from `codehike/code` and animates token transitions to the next step.

`public/codehike-demo/code5.tsx` is a demo step exercising `mark`, `diff`, `focus` and a comment-based `callout` - render a still of its step (frames 360–449 of the `codehike-demo` episode) to see them.

**`highlight()` is async — never call it during render.** All highlighting happens in `calculateMetadata`; components receive ready `HighlightedCode` objects via props.

Composition props (see `src/calculate-metadata/schema.ts`): `episode` (folder under `public/` to load steps from), `theme` (shiki-style theme name) and `width`. With `{type: "auto"}` the video is sized to the longest code line; with `{type: "fixed", value}` the composition is exactly `value` wide and the code box is capped, so long lines wrap (the `word-wrap` handler is wired in by default - see [rules/word-wrap.md](rules/word-wrap.md)).

Fonts: a local Fira Code is loaded in `src/font.ts` via `@remotion/fonts` from `public/fonts/` - no network needed at render time.

## Annotation comment syntax

Annotations are written as comments inside the code files; the comment is removed from the rendered code:

```
// !name                       annotates the next line (block)
// !name(1:3) query            block annotation, line range relative to the comment
// !name[2:8] query            inline annotation, column range (also works at end of a code line)
// !name(start) ... !name(end) block annotation spanning the markers
```

Everything after the range is the `query` string. Line ranges are relative to the comment line, inclusive, 1-based. In TS/TSX files, twoslash adds two more implicit annotations: `// ^?` produces a `callout` with the type at that position, and compiler errors produce `error` annotations.

The upstream `// !name[/regex/]` form does NOT work with the installed `@code-hike/lighter@1.0.3` - regex ranges are silently dropped. Use explicit column/line ranges instead.

## Annotations available by default

Wired into `CodeTransition.tsx`; all timings are in frames (steps are 90 frames, transitions 30).

- **callout** (`src/annotations/Callout.tsx`) — `// !callout[18:26] some note` shows a tooltip-like box under the line, pointing at the column. In TS/TSX, `^?` callouts render the type as a highlighted code block. Fades in at frames 25–35.
- **error** (`src/annotations/Error.tsx`) — wavy red underline plus an error message box below the line. Generated automatically from twoslash errors; the `error-message` box fades in at frames 25–35.
- **mark** (`src/annotations/Mark.tsx`) — `// !mark(1:2) <delay> <duration> <color>` highlights lines (background + left border); `// !mark[2:8] ...` highlights an inline range. Query parts optional, defaults `35 15 #eab308`.
- **diff** (`src/annotations/Diff.tsx`) — `// !diff(1:2) +` / `// !diff(1:2) -` renders green/red line marks with a `+`/`-` sign. Composes onto `mark`, so both must stay in the handlers array.
- **focus** (`src/annotations/Focus.tsx`) — `// !focus(1:3)` keeps those lines at full opacity and dims everything else (frames 35–50).
- **word-wrap** (`src/annotations/WordWrap.tsx`) — no annotations; wraps long lines when the code box is narrower than the longest line (fixed width only).

Occasionally useful extras, implemented but not wired in by default:

- Line numbers — see [rules/line-numbers.md](rules/line-numbers.md)
- File name header — see [rules/filename.md](rules/filename.md)

## Rules that apply to everything

- **Frame-driven only.** Animation state comes from `useCurrentFrame()` + `interpolate()`. CSS transitions/animations, the Web Animations API, and wall-clock timers are FORBIDDEN — they desync from Remotion's frame rendering.
- **Keep layout stable between steps.** Token transitions measure token positions in the DOM; if an annotation changes the layout in only some steps, every token animates the shift. Render structural wrappers unconditionally (transparent when inactive) or use `onlyIfAnnotated` with opacity-only changes.
- **Match the theme.** Use `useThemeColors()` (`src/calculate-metadata/theme.tsx`) and `polished` (`mix`, `readableColor`, `rgba`) instead of hardcoded colors, except universal conventions like diff red/green.

## Going deeper

- Writing a new annotation handler — see [rules/writing-handlers.md](rules/writing-handlers.md)
- How token transitions work and their constraints — see [rules/token-transitions.md](rules/token-transitions.md)
- More Code Hike recipes from upstream (tooltip, collapse, link, tabs, ...) — see [rules/upstream-recipes.md](rules/upstream-recipes.md)

## Pitfalls

- The `codehike` package ships **no built-in handlers** — every handler in `src/annotations/` is project code. Code Hike docs show recipes, not imports.
- Avoid `codehike/utils/selection` and `codehike/utils/static-fallback` — they use click state, `matchMedia` and `localStorage`, none of which are frame-driven.
- Unknown languages fall back to plain text with a console warning; check the file extension if highlighting looks off.
- Removed tokens are not animated (they vanish); added tokens fade in, moved tokens slide.
- Token matching is content-based: identical adjacent tokens may mismatch in complex edits. Split large rewrites into smaller steps if transitions look wrong.
