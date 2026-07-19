# Writing Code Hike annotation handlers

Annotations mark up code (`// !mark(1:2)`); handlers (`AnnotationHandler` from
`codehike/code`) control how marked code renders. The `codehike` package ships
no built-in handlers - every handler in `src/annotations/` is project code.

## Handler shape

```ts
{
  name: string,              // matches the annotation name in comments
  onlyIfAnnotated?: boolean, // drop the handler when nothing matches
  transform?: (annotation) => annotation | annotation[] | undefined,
  Pre?, PreWithRef?,         // wrap the whole <pre>
  Block?, Inline?,           // wrap annotated blocks / inline ranges
  Line?, AnnotatedLine?,     // every line / only annotated lines
  Token?, AnnotatedToken?,   // every token / only annotated tokens
}
```

Block annotations: `{name, query, fromLineNumber, toLineNumber, data?}`.
Inline annotations: `{name, query, lineNumber, fromColumn, toColumn, data?}`
(1-based, inclusive).

## Rules for this project

1. **Frame-driven only.** Animation state comes from `useCurrentFrame()` +
   `interpolate()` inside handler components. See `src/annotations/Mark.tsx`.
2. **Render through `InnerLine` / `InnerToken` / `InnerPre` with `merge={props}`.**
   Handlers chain via an internal stack; spreading props onto your own elements
   throws on duplicate keys. Minimal example: `src/annotations/Focus.tsx`.
3. **Keep geometry constant between steps.** Token transitions measure token
   positions; a wrapper that changes layout in only some steps makes every
   token animate the shift. Render structural wrappers unconditionally
   (`Mark.tsx`, `Diff.tsx`) or use `onlyIfAnnotated` with opacity-only changes
   (`Focus.tsx`).
4. **Compose via `transform`.** A transform can convert inline→block, compute
   `data`, or emit additional annotations: `Error.tsx` derives `error-message`
   from `error`; `Diff.tsx` re-emits a colored `mark` (so `mark` must stay in
   the handlers array).
5. **Match the theme** via `useThemeColors()` + `polished` - except universal
   conventions like diff red/green.
6. **Register in the handlers array** in `src/engine/CodeTransition.tsx`.
   Order matters only for wrapper nesting.

## Gotchas

- `Inline` wrappers change DOM leaves, but token snapshots match leaves by
  content - tokens inside wrappers still transition fine.
- Newlines are plain-string whitespace tokens; `whiteSpace` changes on the pre
  affect scroll math - keep it in `code-style.ts`.
- The `codehike/utils/selection` and `static-fallback` utilities use
  matchMedia/localStorage/clicks - not frame-driven, do not use.
