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
- **focus** - keep annotated lines bright, dim everything else.
  `// !focus(2:5)`
- **callout** - a tooltip-style box under the line, pointing at the column.
  Query: the note text. `console.log(user.location); // !callout[18:26] added in this step`
- **error** - wavy red underline + error message box. Generated automatically
  from TypeScript compiler errors in ts/tsx files (see below); rarely written by hand.

## TypeScript extras (ts/tsx only)

Files go through twoslash (a real TypeScript compiler running locally):

- `console.log(user); // ^?` - shows the type at `^?` as a callout box.
- Compiler errors become `error` annotations automatically. To assert an
  expected error: `// @errors: 2339` on its own line.

## Notes

- Annotation timings are fixed defaults relative to the clip/step (fades land
  shortly after the code settles). Don't try to time annotations via the query.
- Removed lines in a diff (`!diff -`) belong in the OLD step's file; added
  lines in the NEW step's file. The token transition animates the change.
