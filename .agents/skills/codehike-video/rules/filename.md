# File name header

`src/annotations/Filename.tsx` exports a `FileName` component that renders a small tab with the current step's file name. It is **not wired in by default**.

Each step's `meta` is set to its file name by `src/calculate-metadata/process-snippet.ts`, so enabling it is a one-line change in `src/Main.tsx`, inside the `Series.Sequence` above `CodeTransition`:

```tsx
import { FileName } from "./annotations/Filename";

<FileName meta={step.meta} />
<CodeTransition ... />
```

Notes:

- This is a plain Remotion component, not a Code Hike annotation handler. It deliberately sits outside `<Pre>`, so it is not part of the token-transition snapshot and swaps instantly when the step changes. If you want it to fade/slide, wrap it with the usual `useCurrentFrame()` + `interpolate()` pattern.
- Colors come from `useThemeColors()` + `polished`, so it follows the `theme` prop.
