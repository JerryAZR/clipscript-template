# Token transitions

How `src/CodeTransition.tsx` animates one step into the next, and the constraints this imposes.

## Mechanism

1. The component first renders the **previous** step's `HighlightedCode` (or an empty-token version for the first step).
2. In a `useLayoutEffect`, `getStartingSnapshot(ref.current)` records every leaf element (`:not(:has(*))` = individual token spans): x/y (walked up the `offsetParent` chain), computed color, and text content.
3. It re-renders with the new code, then `calculateTransitions(ref.current, snapshot)` matches old↔new tokens **by text content** (array diff) and returns per-token keyframes: moved tokens get `translateX/translateY` + `color`, added tokens get `opacity`. Removed tokens are not animated - they vanish.
4. `options.delay`/`options.duration` are normalized fractions (0–1) of one transition timeline; `CodeTransition` scales them by its `durationInFrames` (30) and applies styles directly to DOM elements every frame via `applyStyle` (`src/utils.ts`) using Remotion's `interpolate`/`interpolateColors`. Opacity uses linear progress; color and translate use an eased progress.
5. The whole measurement is gated by `useDelayRender()`/`continueRender()` so headless Chrome never captures the unmeasured first pass.

## Constraints

- **Never use the Web Animations API** (`element.animate`) for this - it runs on wall-clock time and desyncs from frame-based rendering. The upstream Code Hike recipe uses WAAPI; this template replaces it with per-frame style application. Same reason CSS transitions/animations are forbidden.
- The `tokenTransitions` handler (`src/annotations/InlineToken.tsx`) must be in the handlers array - it makes every token `display: inline-block` so transforms apply. The `<Pre>` needs `position: relative` (set in `CodeTransition.tsx`) because snapshot coordinates are relative to the `offsetParent`.
- **Fonts must be loaded before the snapshot**, otherwise measurements are wrong. `calculateMetadata` awaits `waitUntilDone()` from `src/font.ts`, which covers this.
- Snapshot/transitions run in `useLayoutEffect` with real DOM - never call these utils during server-side prop computation.
- Matching is content-based: identical adjacent tokens can mismatch in heavy edits. If a transition looks wrong, split the edit into smaller steps.
- Wrappers added by annotation handlers (mark backgrounds, line numbers) are not leaf elements, so they don't get their own transitions - the tokens inside them move. Keep wrapper geometry identical between steps (see [writing-handlers.md](writing-handlers.md)).
- Elements outside `<Pre>` (progress bar, `FileName` header) are not snapshotted and switch instantly between steps.
