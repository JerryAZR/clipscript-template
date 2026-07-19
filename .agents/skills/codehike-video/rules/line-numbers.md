# Line numbers

`src/annotations/LineNumbers.tsx` renders a dimmed gutter number before every line. It is exported but **not wired in by default**.

To enable, add it to the handlers array in `src/CodeTransition.tsx`:

```tsx
import { lineNumbers } from "./annotations/LineNumbers";

const handlers: AnnotationHandler[] = useMemo(() => {
  return [tokenTransitions, mark, diff, focus, callout, errorInline, errorMessage, wordWrap, lineNumbers];
}, []);
```

Caveats:

- Enable it for the whole video or not at all. The gutter shifts every token's x position; if only some steps have it, token transitions animate the shift as a sideways jump. (The handler has no `onlyIfAnnotated` flag, so it applies to every step once wired in.)
- The gutter numbers are leaf DOM elements, so they participate in the token-transition snapshot. Their content (`1`, `2`, ...) matches across steps and stays put.
- The line rows become flex containers (`display: flex` in the handler) - this template's line divs are not flex by default, unlike the Code Hike docs site the recipe comes from.
