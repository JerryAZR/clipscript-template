# CodeTransition mechanics

`src/engine/CodeTransition.tsx` morphs between two highlighted code states
frame by frame. Adapted from Code Hike's token-transitions recipe - the
official recipe uses the Web Animations API, which is wall-clock driven and
desyncs from Remotion's frame rendering; this version applies styles manually
per frame.

## The two-pass flow

1. Render the previous code; in `useLayoutEffect`, `getStartingSnapshot(ref)`
   records every leaf element's (`:not(:has(*))` default, `.ch-line` for line
   granularity) x/y/color/content.
2. Re-render the new code; `calculateTransitions` matches old<->new by text
   content (array diff) and produces keyframes: moved tokens get
   translate+color, added tokens get opacity. Removed tokens vanish.
3. Each frame, `applyStyle` writes interpolated `translate`/`color`/`opacity`
   directly to the DOM elements (`options.delay/duration` are normalized
   fractions scaled by `transitionDuration`). `useDelayRender` gates capture
   until measurement is done.

The component is re-keyed per step (`key={stepIndex}` in CodeClip), so state
resets by React remount - no manual reset logic. `frame` arrives as a prop
(from `useClipFrame` upstream).

## The premount bug (fixed, do not regress)

Sequences premount children offscreen (`top: -999999px` in Remotion 4). The
mount-time snapshot therefore measured garbage positions and every token
phantom-flew-in for ~15 frames at each clip start. Fix: content-identical
self-morphs (step 0, carry-in frames) skip the transition machinery entirely
(`isStatic` check). If you ever need a real morph at mount time, snapshot only
after confirming visibility - never assume mount == visible.

## Constraints

- `tokenTransitions` handler (inline-block tokens) or the `lineTransitions`
  `.ch-line` wrapper must be present; the `<Pre>` needs `position: relative`.
- Fonts must be loaded before snapshots (handled: `waitUntilDone()` in
  `calculateMetadata`).
- Matching is content-based: identical adjacent tokens can mismatch in heavy
  edits - split big rewrites into smaller steps, or use `transition: "line"`.
