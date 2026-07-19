# Timeline compiler and state resolver

## The fence algorithm (`src/engine/timeline.ts`)

Single forward pass, ported from the bevy project's `scripts/engine/timeline.py`:

1. Lines lay back-to-back: `line.startFrame = nextStart`, `nextStart += durationFrames`.
2. Clips starting at a line get `startFrame = lineStart + offsetFrames`.
3. Non-`end` conditions resolve to `lineStart + offsetFrames` when their line is reached. A condition with `sync` (defaulting to its own line) is a **fence**: `nextStart = max(nextStart, value)` - the timeline holds until the condition's frame.
4. `end: true` conditions resolve to the line's end **after** fences (they absorb fence delays).
5. Clip end = max of its condition values; must exceed its start. `totalFrames = max(nextStart, all clip ends)` - a deliberate deviation from the Python original, which truncated clips at the last line end.

Validation (all hard errors naming the clip): unknown line/sync references,
`end: true` + offsetFrames, sync-before-line, empty `endAt`, zero/negative
duration, unresolved clips.

Per-clip mutable state lives in one `states: ClipState[]` record array (the
Python mutated dataclasses; earlier parallel-array version was refactored).

## Key-chain state resolver (`src/engine/clips/code-state.ts`)

Runs after the timeline, walks code clips in `startFrame` order, and threads a
per-key store `{ step, scroll, rect, filename, tailFrame }`:

- Clip flow: load store -> apply config -> emit. Effective steps =
  `[store.step, ...clip.steps]` when chained (carry-in renders static, then
  internal pacing takes over). `scrollFrom = store.scroll ?? 0`. Rect and
  filename inherit unless overridden.
- Write-back: last step, `scrollTo ?? scrollFrom`, rect, filename, and
  `tailFrame = endFrame + transitionOut`.
- Errors: same-key overlap including the tail (no cross-fades), missing rect
  with nothing to inherit, empty steps. Warnings: top-left corner moved
  between chained clips; `transitionDuration > stepInterval`.

The resolver emits plain data - components never see keys or the store.
Store shape is code-clip-specific by design; a generic state-channel
abstraction was considered and rejected ("don't generalize what you cannot").
