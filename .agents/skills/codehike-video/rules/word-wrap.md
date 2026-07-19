# Word wrap

`src/annotations/WordWrap.tsx` is wired in by default in `src/CodeTransition.tsx`. It has no annotation syntax - it only changes how long lines render.

Behavior:

- With `width: {type: "auto"}` (the default) the composition is sized to the longest line, so nothing ever wraps and the handler is a no-op.
- With `width: {type: "fixed", value}` the code box is capped at `value - 2 * horizontalPadding` (see `src/calculate-metadata/calculate-metadata.tsx`) and longer lines wrap. Continuation lines hang-indent to the line's original indentation (negative `text-indent` trick from the upstream recipe).

Implementation notes:

- The handler sets `white-space: pre-wrap` on the `<Pre>`, wraps line contents in a div with `textIndent: -Nch; marginLeft: Nch`, and resets `textIndent` on tokens.
- Wrapped lines reflow the layout, so token positions measured by the transition snapshot already account for wrapping - transitions across steps with different wrap points animate correctly.
- Adapted from the upstream `word-wrap` recipe, with Tailwind classes replaced by inline styles.
