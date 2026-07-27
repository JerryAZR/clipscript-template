# Code annotations

Annotations are comments inside code files (in `public/<episode>/code/`). The
comment is removed from the rendered code. Markers carry range and optional
style - never timing; the framework paces all animation.

## Syntax

```
// !name                       annotates the next line (block)
// !name(1:3) query            block annotation, line range relative to the comment
// !name[2:8] query            inline annotation, column range (also works end-of-line)
// !name(start) ... !name(end) block spanning the markers
```

The upstream `// !name[/regex/]` form does NOT work with the installed
`@code-hike/lighter@1.0.3` - regex ranges are silently dropped. Use explicit
column/line ranges.

## Available annotations

- **mark** - highlight lines or an inline range (background + left border /
  outline). Query: optional color (default amber).
  `// !mark(1:2)` or `// !mark[13:17] #22c55e`
- **diff** - mark lines as added/removed, like a diff. Query: `+` or `-`.
  `// !diff(1:5) +` renders a green background with a `+` gutter sign.
- **from** - token-level diff of a single line, for changes better shown as a
  mutation than a replaced line. Trailing comment whose query is the full OLD
  version of the line; the renderer computes the word diff. Inserted text gets
  a green background, removed text is injected struck through on red:
  `int renamed_var = f(); // !from int old_var = f();` renders
  `int old_var(struck) renamed_var(green) = f();`. Covers insertion,
  replacement and mid-line deletion; use line-level `!diff` for whole-line
  rewrites or removed lines. Leading whitespace of the old line is ignored
  (re-aligned to the new line's indent).
- **focus** - keep annotated lines bright, dim everything else.
  `// !focus(2:5)`
- **callout** - a tooltip-style box under the line, pointing at the column.
  Query: the note text. `console.log(user.location); // !callout[18:26] added in this step`

There are no TypeScript extras: twoslash (which provided `^?` type callouts
and automatic compiler-error annotations) was dropped. All annotations are
written by hand as comments.

## Notes

- Annotations appear instantly with their code state - no fade-in. A
  carried-over annotation never re-fades, which keeps chained clips
  visually continuous; a morph introduces the new step's annotations with
  the step's content.
- Removed lines in a diff (`!diff -`) belong in the OLD step's file; added
  lines in the NEW step's file. The token transition animates the change.
- `!from` comments live in the NEW step's file, on the line in its new state.
