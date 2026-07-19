# Writing a new annotation handler

An `AnnotationHandler` (from `codehike/code`) customizes how annotated code renders. The full type:

```ts
{
  name: string,              // matches the annotation name in comments: // !name
  onlyIfAnnotated?: boolean, // drop the handler entirely when no annotation matches
  transform?: (annotation) => annotation | annotation[] | undefined,
  Pre?: CustomPre,           // wrap the whole <pre>
  PreWithRef?: CustomPre,    // same, with access to the DOM ref
  Block?: ...,               // wrap an annotated block of lines
  Line?: ...,                // customize EVERY line
  AnnotatedLine?: ...,       // customize only annotated lines
  Inline?: ...,              // wrap an annotated inline range
  Token?: ...,               // customize EVERY token
  AnnotatedToken?: ...,      // customize only annotated tokens
}
```

Annotation shapes: block annotations are `{name, query, fromLineNumber, toLineNumber, data?}`; inline annotations are `{name, query, lineNumber, fromColumn, toColumn, data?}` (1-based, inclusive).

## The rules for this template

1. **Frame-driven animation only.** Compute all animation state from `useCurrentFrame()` + `interpolate()` inside the handler's components. Never CSS transitions, WAAPI, or timers. Example: `src/annotations/Mark.tsx`.

2. **Always render through `InnerLine` / `InnerToken` / `InnerPre` with `merge={props}`.** Handlers chain via an internal `_stack`; spreading props onto your own elements throws on duplicate keys. Add your own `style`/`className` as extra props to `InnerLine` - they get merged. See `src/annotations/Focus.tsx` for the minimal pattern.

3. **Keep geometry constant between steps.** Token transitions measure token positions per step; a handler that changes layout in only some steps makes every token animate the shift. Either render structural wrappers unconditionally (`Mark.tsx` and `Diff.tsx` render transparent wrappers for every line), or use `onlyIfAnnotated: true` with opacity-only changes (`Focus.tsx`).

4. **Use `transform` to compose.** A transform can convert inline→block annotations, compute `data`, or emit additional annotations. `src/annotations/Error.tsx` derives an `error-message` block annotation from each `error` inline annotation; `src/annotations/Diff.tsx` re-emits a colored `mark` (which is why `diff` requires `mark` in the handlers array).

5. **Match the theme.** Pull colors from `useThemeColors()` (`src/calculate-metadata/theme.tsx`) and derive variants with `polished` (`mix`, `readableColor`, `rgba`) instead of hardcoding - except universal conventions like diff red/green. Timings should sit after the 30-frame transition; existing defaults fade annotations in around frames 25–50 of each 90-frame step.

6. **Register the handler** in the `handlers` array in `src/CodeTransition.tsx`. Order matters only for nesting of `Line`/`Token` wrappers; put purely visual wrappers (mark, focus) before box-rendering ones (callout, error).

## Verifying

Render a still of the affected step and inspect it:

```bash
npx remotion still Main out/check.png --frame=415
```

`public/codehike-demo/code5.tsx` (frames 360–449) is a convenient step to add your annotation to.
