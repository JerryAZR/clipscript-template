---
name: episode-authoring
description: Authoring tutorial/dev-log video episodes - subtitle script, storyboard clips, voiceover, verification
metadata:
  tags: episode, subtitles, storyboard, clips, voiceover, tutorial
---

## When to use

Use this skill when creating or editing an episode: the subtitle script, the storyboard (clips), code/video assets, voiceover, or when checking that an episode renders correctly.

## The 80% path

An episode is a folder under `public/<episode>/` plus `src/episodes/<episode>/storyboard.ts` registered in `src/episodes/registry.ts`.

**1. Write the script** in `public/<episode>/subtitles.toml` - a flat `[[lines]]` list. The text is shown as subtitles and spoken by TTS; the lines are the master clock of the whole video. Keep one point per line.

```toml
# Comments organize topics for reviewers
[[lines]]
id = "intro.first"
text = "Welcome to the episode."

[[lines]]
id = "code.intro"
text = "Here is the code we will write."
```

**2. Generate voiceover** (content-hash cached, re-run after every script edit):

```bash
npx tsx scripts/tts.mts --episode <name>   # edge-tts by default; tts.config.toml for OpenAI-compatible endpoints
```

**3. Write the storyboard** - typed clip objects referencing line ids, never frames:

```ts
import { rects } from "../../engine/clip-style";
import type { Storyboard } from "../../engine/types";

export const storyboard: Storyboard = {
  // background: { src: "bg.png", dim: 0.7 },   // optional backdrop, public/<episode>/images/
  clips: [
    {
      id: "intro-title",
      type: "cinematic-title",
      title: "Episode Title",
      subtitle: "optional",
      rect: rects.full,
      startAt: { line: "intro.first" },
      endAt: [{ line: "intro.first", end: true }],
    },
    {
      id: "main-code",
      type: "code",
      key: "main",
      steps: ["v1.ts", "v2.ts"],          // files in public/<episode>/code/
      filename: "users.ts",               // tab label
      rect: rects.splitLeft,
      startAt: { line: "code.intro" },
      endAt: [{ line: "code.intro", end: true }],
    },
    {
      id: "term",
      type: "terminal",
      steps: [{ cwd: "~/app", command: "npm install", output: ["added 361 packages"] }],
      rect: rects.splitRight,
      startAt: { line: "code.intro" },
      endAt: [{ line: "code.intro", end: true }],
    },
  ],
};
```

**4. Verify**: `npx tsx scripts/timeline-check.ts <episode>` prints every line/clip's frame range; `npx remotion still <Comp> out/check.png --frame=N` renders one frame to look at (comp id = episode name with `/` → `-`); `npm test` before committing.

## Fields every clip has

`id`, `type`, `rect?` (`{x,y,w,h}` - px or `"NN%"`), `zIndex?`, `startAt`, `endAt`, `transitionIn?`/`transitionOut?` (pane fade, frames), `paneTitle?` (title bar rendered by the pane above the content). `endAt` is a list of conditions (clip ends at the max):

- `{ line: "a.b" }` - when the line starts (`offsetFrames` shifts it)
- `{ line: "a.b", end: true }` - when the line finishes (spans the whole line)
- `{ line: "a.b", offsetFrames: 150, sync: "a.b" }` - fence: the timeline waits for this frame

Standard rects come from `rects` in `src/engine/clip-style.ts`: `rects.full` (title pages, backgrounds), `rects.large` (the standard single window), `rects.medium` (smaller centered window), `rects.splitLeft`/`rects.splitRight` (side-by-side pair). A custom `{x,y,w,h}` (px or `"NN%"` of 1920x1080) is an explicit, scene-specific choice - inset cards, asymmetric layouts. Overlay on top = small rect + `zIndex: 10`. `paneTitle` labels a pane from the outside (comparison-style split screens); for one shared title above cooperating panes, place a `cinematic-title` clip in a top rect instead.

## Clip types (common config)

- **cinematic-title** - `title`, `subtitle?`. The default title page: spring title, growing underline, subtitle fade. Full-screen rect, its own line.
- **code** - `steps` (code files, morphs between them), `key?` (chain continuity), `filename?`, `stepInterval?` (60), `transitionDuration?` (30), `transition?` ("token"/"line"), `scrollTo?`, `scrollDuration?`. Code annotations live in the code files as comments - see [rules/annotations.md](rules/annotations.md).
- **terminal** - `steps` (`{cwd?, command, output?[]}[]`), `typeSpeed?` (1), `pauseAfterCommand?` (15), `outputLineDelay?` (10), `showCursor?` (true).
- **video** - `src` (file in `video/`), `startFrom?`, `playbackRate?`, `muted?` (true), `loop?` (false).
- **overlay** - `text`, `title?`. Callout card; give it a small rect + `zIndex`.

Defaults in parentheses. Key chains: clips sharing `key` continue exactly where the previous ended (code step, scroll, rect, filename) - they must not overlap and must keep the same top-left corner.

Also available: **animated-list** (staggered bullet reveal), **progress** (done/current/todo checklist), **countdown** (ring timer; pair with a sync fence to hold the timeline), **chapter-title** (numbered chapter card), **notification-pop** (toast stack), **progress-steps** (horizontal stepper) - config in [rules/more-clips.md](rules/more-clips.md).

## When the 80% path isn't enough

- Full storyboard reference (all end conditions, validation rules) - [rules/storyboard-format.md](rules/storyboard-format.md)
- Voiceover details (voices, cache, pronunciation, replacing the pipeline) - [rules/subtitles-and-voiceover.md](rules/subtitles-and-voiceover.md)
- Code annotations (mark, diff, from, focus, callout) - [rules/annotations.md](rules/annotations.md)
- Debugging renders - [rules/verification.md](rules/verification.md)
- Per-clip deep dives - [rules/code-clip.md](rules/code-clip.md), [terminal-clip.md](rules/terminal-clip.md), [video-clip.md](rules/video-clip.md), [overlay-clip.md](rules/overlay-clip.md), [cinematic-title-clip.md](rules/cinematic-title-clip.md)
