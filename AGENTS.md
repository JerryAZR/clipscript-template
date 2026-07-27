# template-coding-video

A Remotion template for programming tutorial / dev-log videos, built around a
narration-driven clip engine: narration is the master clock, visuals are
modular clips anchored to narration lines.

## Layout

- `public/<episode>/` — episode assets: `narration.toml` (the script),
  `code/` (code steps), `video/` (recordings), `voiceover/` (generated mp3s)
- `src/engine/` — the clip engine (timeline compiler, renderer, clips)
- `src/episodes/<episode>/` — `storyboard.ts` (typed clip list) per episode
- `src/annotations/` — Code Hike annotation handlers (mark, diff, focus, callout, error)
- `doc/` — `checklist.md` (roadmap), `clip-inventory.md`, `clip-engine-port.md` (design history)
- `scripts/` — `tts.mts` (voiceover), `annotate-diff.mts` (annotated code steps from file versions), `timeline-check.ts`, `timeline-node.ts` (shared node timeline loader)

## Commands

- `npm run dev` — Remotion Studio
- `npm run lint` — tsc + eslint
- `npm test` / `test:unit` / `test:smoke` — vitest + render smoke tests
- `npx tsx scripts/tts.mts --episode <name>` — generate voiceover (edge-tts, hash-cached)
- `npx tsx scripts/annotate-diff.mts --out public/<ep>/code/ v1.ts v2.ts [...]` — generate annotated code steps from pristine versions (`--static` for merged diff views)
- `npx remotion still <Comp> --frame=N` — render one frame for visual checks

## Episodes (registered in `src/episodes/registry.ts`)

- `showcase` — the framework's ad video; the polished example of what the
  engine can do
- `code-tutorial` — a realistic tutorial slice (code chain, annotations,
  terminal, overlay). Reference for authoring real episodes
- `clip-gallery` — one line per clip type; a visual catalog + minimal config
  examples
- `diff-tool` — annotate-diff workflow showcase: prepare sources, run the
  tool, wire outputs, rendered result. Its `code/gen/` assets are the tool's
  real output (see the storyboard header for the exact commands)
- `demo` — engine test fixture (kitchen sink covering every clip; the smoke
  suite targets it). Not a reference for authors
- `codehike-demo` — legacy hand-rolled Code Hike demo, outside the clip engine

## Rules that apply everywhere

- Narration lines drive all pacing; clips anchor to line ids, never compute frames by hand.
- Frame-driven animation only. CSS transitions/animations, WAAPI, and wall-clock timers are FORBIDDEN.
- Everything async (parsing, durations, highlighting) happens in `calculateMetadata`, never during render.
- Theme colors via `useThemeColors()` + `polished`; never hardcode colors (universal conventions like diff red/green excepted).
- Fail loudly on bad input; no silent fallbacks.
- Never measure DOM at mount time (Remotion premounts Sequences offscreen).

## Where to get help

Load the skill matching your task: `episode-authoring` (making episodes),
`clip-development` (writing custom clips), `engine-internals` (modifying the
engine itself), `remotion-best-practices` (general Remotion knowledge).
