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
- `scripts/` — `tts.mts` (voiceover), `timeline-check.ts`, `timeline-node.ts` (shared node timeline loader)

## Commands

- `npm run dev` — Remotion Studio
- `npm run lint` — tsc + eslint
- `npm test` / `test:unit` / `test:smoke` — vitest + render smoke tests
- `npx tsx scripts/tts.mts --episode <name>` — generate voiceover (edge-tts, hash-cached)
- `npx remotion still <Comp> --frame=N` — render one frame for visual checks

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
