# Clip engine port — investigation report & plan

Working document. Captures the investigation of `~/Projects/Bevy/bevy-tower-defense-videos`
("bevy project") and the decisions for porting its clip-based video framework into this
template. Status: **design agreed, implementation not started**.

## Goal

Turn this template into a narration-driven, clip-based framework for programming
tutorial / dev-log videos. Narration is the master clock; visuals are modular,
reusable clips anchored to narration lines. Clean rewrite — no compatibility with
the bevy project required.

## What the bevy engine does (investigation summary)

- `narration.toml` (paragraphs → lines with ids) is the text source of truth.
  Python (edge-tts) synthesizes one mp3 per line (content-hash cached), measures
  durations, and a fence algorithm (`scripts/engine/timeline.py`) lays lines
  back-to-back while clips can "hold" the timeline via `sync` conditions.
  Output: `public/ep{N}/manifest.json` with absolute frames for lines and clips.
- React: per-episode `calculateMetadata` factory fetches the manifest,
  pre-highlights code, pre-renders mermaid; `ParagraphRenderer` places clips into
  `rect` panes (`px` or `"NN%"`), stacked by `zIndex`, with renderer-driven
  enter/exit slide+fade (`transitionIn`/`transitionOut`). Clips anchor to lines:
  `startAt = { line, offsetFrames }`, `endAt = [{ line, end: true }]`.
- Clip runtime contract: `React.FC<{ clip }>`, self-animated via `useClipFrame()`
  (clip-local frame, transition-in compensated); registry per episode:
  `{ ...sharedClipComponents, ...episodeClips }`.
- Validation culture: coverage check (no blank frames), lint (focusLines range,
  scroll continuity, one-sided transitions), fail-fast on unknown clip types.

### Bevy weaknesses to not carry over

- Python/uv toolchain; `manifest.json` as an intermediate; `durations.json` step.
- Weak typing: clip configs `Record<string, any>`, `rect` is `z.any()`.
- Hardcoded: language (rust-or-toml) in highlight, Chinese UI strings in shared
  clips, `#0d1117` palette, `LINE_HEIGHT = 28` scroll guesswork.
- Annotation fades use the **global** frame (buggy when clips start mid-timeline).
- Paragraphs as hard runtime boundaries → `transitionOut` tails cut at boundaries,
  special `end: true` fence semantics, two kinds of transitions.
- Per-episode boilerplate copied byte-identically (TitlePageClip, FontLoader).
- Uniform `stepInterval` only; no per-step durations.

## Decisions (agreed with user)

1. **Pure TypeScript** — drop Python entirely. `calculateMetadata` does everything
   except TTS: parse narration + storyboard, measure mp3 durations in-browser
   (Mediabunny — kills `durations.json`), compute the timeline, pre-highlight,
   run coverage/lint as load-time errors/warnings. Only pre-build left:
   `scripts/tts.mts` (Node, `msedge-tts`, content-hash cache, pluggable).
2. **Narration/voiceover is first-class** and drives pacing. Lines with missing
   mp3 get an estimated duration (chars/sec) so silent episodes still render —
   TTS is an incremental layer.
3. **Framework first, minimal clips**: port `title`, `code`, `terminal` only —
   enough to exercise rect layout, zIndex, line-anchored spans, clip-local time,
   pre-highlighting. More clip types later.
4. **Authoring format split by audience**:
   - `public/<episode>/narration.toml` — all spoken text in one reviewable file,
     `[[paragraphs.lines]]` with `id` + `text`. (Needs a JS TOML parser, e.g.
     `smol-toml`.)
   - `src/episodes/<episode>/storyboard.ts` — typed clip lists (discriminated
     unions), references line ids, never text. Single source of truth preserved:
     text only in narration.toml, visuals only in storyboard.
5. **Clip = Sequence + rect + registry.** The runtime is thin sugar over
   `<Sequence>` (mount window, local frame, premount for free) + a
   `useClipFrame(transitionIn)` hook. The framework's value is the timeline
   compiler, the authoring model, and validation — not runtime mechanics.
6. **Sections are metadata, not boundaries.** Keep topic grouping (id namespace
   `section.line`, authoring chunks, per-section reporting) but the compiled
   timeline is flat: clips may span section boundaries; one transition mechanism
   everywhere. No `ParagraphRenderer` null-clipping.

## Target layout

```
public/<episode>/    narration.toml, code/, video/, voiceover/*.mp3 (generated)
src/episodes/<ep>/   storyboard.ts, episode-specific clips
src/engine/          narration.ts, timeline.ts, manifest types, ClipRenderer,
                     useClipFrame, clips/ (title, code, terminal),
                     calculate-metadata.ts, highlight.ts, validation
scripts/tts.mts      narration.toml → voiceover/*.mp3 (hash-cached)
```

## Milestones (build & verify incrementally)

**Testing infrastructure (post-M2)**: vitest unit tests for the pure core
(`timeline.ts`, `code-state.ts`, `narration.ts`, `registry.ts`) plus a render
smoke test (`tests/smoke/render.smoke.test.ts`) that derives sample frames
from the actual timeline and asserts cross-frame invariants with pngjs:
absolute theme/card colors, non-blank frames, static holds ≈ 0 diff, chain
continuity ≈ 0 diff (full-frame AND tab-strip crop), morphs differing from
both endpoints, scroll-target verification via crop matching, title/split/
banner presence. CI: `.github/workflows/ci.yml` (lint → unit → smoke, with
cached Remotion browser).

Known conscious test gaps: OCR/content correctness (out of scope), twoslash
output correctness, the `transitionOut` exit fade (no demo clip uses it),
the `transition: "line"` granularity path (no demo coverage), and
React-component error paths (unknown clip type) - no React test setup.

**Bug found by the smoke test (fixed)**: Sequences premount offscreen
(`top: -999999px`), so the mount-time transition snapshot measured garbage
positions and every token phantom-flew-in for ~15 frames at each clip start.
Fix: `CodeTransition` detects content-identical self-morphs (step 0) and skips
the transition machinery entirely.

**Engine rule codified by that bug**: never measure DOM at mount - Remotion
may premount offscreen. Measure per-frame or after visibility.

**Twoslash is fully local** (no CDN dependency): `twoslash-cdn` accepts a
custom `fetcher`; `scripts/prepare-twoslash-libs.mjs` (wired to `postinstall`)
copies the TS compiler + lib types from `node_modules/typescript` into
`public/vendor/ts-lib/` (gitignored, ~12MB), and the fetcher in
`process-snippet.ts` rewrites `/cdn/*/typescript/lib/*` URLs to `staticFile`.
Verified: `^?` callout renders with zero `playgroundcdn` requests. Only ATA
type-acquisition for npm imports in snippets would still touch the network.

1. ~~**Engine core**~~ **DONE** — types, narration parser (`smol-toml`), fence
   timeline, `calculateMetadata`, `ClipRenderer`, `useClipFrame`; silent demo
   episode (`public/demo/` + `src/episodes/demo/`), title clips; verified with
   stills (span, split-screen, sync fence, transitions) + negative test.
   Deviations from the original bevy design worth remembering:
   - narration.toml is a **flat `[[lines]]` list** — no sections anywhere
     (ids carry namespaces by convention, `# comments` for reviewers).
   - Clips render inside real `<Sequence>`s, so `useCurrentFrame()` is
     clip-local by construction (bevy frame-filtered divs with global frames —
     the source of their global-frame annotation bugs).
   - `CalculateMetadataFunction` does **not** receive the composition fps;
     duration estimates use the shared `EPISODE_FPS` constant in
     `src/engine/calculate-metadata.ts` (imported by Root.tsx).
   - **Transitions are parent-managed** (agreed with user): the renderer owns
     pane enter/exit; clip-internal animation is content and starts after
     `transitionIn` (`useClipFrame`). Clips never re-animate the transition
     themselves. Default style is **fade-only** — it composes pairwise into a
     cross-dissolve for free (A's transitionOut tail overlaps B's
     transitionIn) without implying spatial relationships. Position-based
     styles (slide/wipe/push, from RVE recipes) are deliberately deferred;
     extension point: the enter/exit progress in `ClipPane` maps to
     transforms via a future per-clip transition-style field.
2. ~~**Code clip**~~ **DONE** — `CodeClipDef` (steps, `key`, `scrollTo`,
   `stepInterval`, `transitionDuration`, `transition: token|line`,
   `filename`), compile-time key-chain state threading
   (`src/engine/clips/code-state.ts`) with the three rulings: same-key
   overlap incl. transitionOut tails = error, top-left mismatch = warn,
   inherit-unless-overridden (step, scroll, rect, filename). Engine
   `CodeTransition` takes a `frame` prop and is re-keyed per step (remount =
   state reset); line-granularity via a `.ch-line` wrapper annotation.
   Pre-highlighting in `calculateMetadata` via the existing processSnippet
   path (extension→lang + twoslash). `code-style.ts` constants kill the
   LINE_HEIGHT guesswork. Mark/diff queries simplified to style-only
   (timing is the framework's). Demo: `code-1`/`code-2` chain over
   `public/demo/code/v1-3.ts`, verified with stills + negative tests
   (overlap error, 404 step error).
3. **Terminal clip + split-screen demo** — code left, terminal right; one clip
   spanning several narration lines. Validates the two key patterns.
4. **TTS pre-build** — `scripts/tts.mts`; real voiceover in demo episode.
   (Network in some environments may block the TTS endpoint — degrade gracefully.)
5. **Validation + docs** — coverage/lint in `calculateMetadata`; update
   `codehike-video` skill to the new authoring workflow.

## Open: reactvideoeditor/remotion-templates submodule

Investigated (cloned to `../remotion-templates`, sibling of this project). Findings:

- 81 single-file, zero-prop demo components; hardcoded content/colors/timing;
  full-frame assumptions; no `Sequence`/`TransitionSeries` usage anywhere;
  animation is clean 10–30-line spring/interpolate recipes.
- Transitions/split-screen/PiP are demo scenes with hardcoded children — the
  *pattern* (stacked layers + progress) is trivially portable, the files are not.
  Nothing here answers framework-level questions; bevy's engine is ahead of it.
- Quality is demo-grade: two files import `next/image` (won't compile), one uses
  CSS keyframes (non-deterministic), one uses per-render `Math.random()`.
- Licensing: MIT claimed in README prose only; no LICENSE file; inconsistent
  attribution headers (37/81 files).

Recommendation: **no submodule** — there is nothing importable to depend on.
Keep the clone as a sibling reference checkout; port individual recipes into
`src/engine/clips/` with an attribution header as clip types are added
(post-milestone-5 candidates: chapter-title, lower-third, progress-steps,
animated-list, text-highlight, end-card, notification-pop, stat-counter).
Useful now mainly for spring/easing recipes for clip enter/exit transitions.
