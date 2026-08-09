---
name: engine-internals
description: Implementation details of the clip engine - only needed when modifying or debugging the engine itself (timeline, state resolver, transition machinery)
metadata:
  tags: engine, internals, timeline, maintenance, debugging
---

## When to use

Only when modifying or debugging the engine's own machinery: the timeline compiler, code-state resolver, clip renderer, or CodeTransition. For authoring episodes, use `episode-authoring`; for writing clip components, use `clip-development`.

## Architecture in one page

**Compile time** (`calculateMetadata`, async, Node/browser): parse subtitles.toml and storyboard.ts → measure audio durations (Mediabunny; estimated when missing) → `calculateTimeline` (fence algorithm → absolute frames) → `resolveCodeState` (key-chain threading: carry-in steps, scroll/rect/filename inheritance, overlap validation) → pre-highlight code (lighter). Output: fully resolved `Timeline` + props.

**Runtime** (per frame, synchronous): `ClipRenderer` mounts each clip in a `<Sequence from durationInFrames>` at its resolved rect with zIndex and renderer-owned fade transitions. Clips are `React.FC<{clip}>` components reading only their resolved config and `useClipFrame()`.

Module map: `src/engine/` - `types.ts` (clip defs, `ClipCommon` mixin + union), `subtitles.ts`, `audio.ts`, `timeline.ts`, `clips/code-state.ts`, `ClipRenderer.tsx`, `calculate-metadata.ts`, `highlight.ts`, `CodeTransition.tsx`, `Episode.tsx`, contexts (`theme`, `HighlightContext`, `EpisodeNameContext`), `clips/` (components), `code-style.ts`.

## Known traps (learned the hard way)

- **Remotion premounts Sequences offscreen** (`top: -999999px`) - mount-time DOM measurement reads garbage. Never measure at mount; measure per-frame or after visibility. This produced the phantom-morph bug (see [rules/code-transition.md](rules/code-transition.md)).
- **`CalculateMetadataFunction` receives no fps** - `EPISODE_FPS` in `calculate-metadata.ts` is the shared constant.
- **The `@remotion/non-pure-animation` lint rule** fires on prop-passed frames - `CodeTransition.tsx` disables it file-level with justification.
- **`!name[/regex/]` annotations are silently dropped** by `@code-hike/lighter@1.0.3`; only `[cols]`/`(lines)` ranges work.

## References

- Timeline compiler + key-chain state resolver - [rules/timeline.md](rules/timeline.md)
- CodeTransition two-pass mechanics + the premount bug - [rules/code-transition.md](rules/code-transition.md)
- Highlighting (offline lighter, annotation extraction) - [rules/highlighting.md](rules/highlighting.md)
