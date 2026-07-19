---
name: episode-authoring
description: Authoring tutorial/dev-log video episodes - narration script, storyboard clips, voiceover, verification
metadata:
  tags: episode, narration, storyboard, clips, voiceover, tutorial
---

## When to use

Use this skill when creating or editing an episode: the narration script, the storyboard (clips), code/video assets, voiceover, or when checking that an episode renders correctly.

## The 80% path

An episode is a folder under `public/<episode>/` plus `src/episodes/<episode>/storyboard.ts` registered in `src/episodes/registry.ts`.

**1. Write the script** in `public/<episode>/narration.toml` - a flat `[[lines]]` list. Narration lines are the master clock of the whole video. Keep one point per line.

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
npx tsx scripts/tts.mts --episode <name>   # [--voice en-US-AriaNeural] [--rate +0%]
```

**3. Write the storyboard** - typed clip objects referencing line ids, never frames:

```ts
import type { Storyboard } from "../../engine/types";

export const storyboard: Storyboard = {
  clips: [
    {
      id: "intro-title",
      type: "title",
      title: "Episode Title",
      subtitle: "optional",
      rect: { x: 0, y: 0, w: "100%", h: "100%" },
      startAt: { line: "intro.first" },
      endAt: [{ line: "intro.first", end: true }],
    },
    {
      id: "main-code",
      type: "code",
      key: "main",
      steps: ["v1.ts", "v2.ts"],          // files in public/<episode>/code/
      filename: "users.ts",               // tab label
      rect: { x: "10%", y: "10%", w: "80%", h: "80%" },
      startAt: { line: "code.intro" },
      endAt: [{ line: "code.intro", end: true }],
    },
    {
      id: "term",
      type: "terminal",
      steps: [{ cwd: "~/app", command: "npm install", output: ["added 361 packages"] }],
      rect: { x: "53%", y: "15%", w: "42%", h: "70%" },
      startAt: { line: "code.intro" },
      endAt: [{ line: "code.intro", end: true }],
    },
  ],
};
```

**4. Verify**: `npx tsx scripts/timeline-check.ts` prints every line/clip's frame range; `npx remotion still Episode out/check.png --frame=N` renders one frame to look at; `npm test` before committing.

## Fields every clip has

`id`, `type`, `rect?` (`{x,y,w,h}` - px or `"NN%"`), `zIndex?`, `startAt`, `endAt`, `transitionIn?`/`transitionOut?` (pane fade, frames). `endAt` is a list of conditions (clip ends at the max):

- `{ line: "a.b" }` - when the line starts (`offsetFrames` shifts it)
- `{ line: "a.b", end: true }` - when the line finishes (spans the whole line)
- `{ line: "a.b", offsetFrames: 150, sync: "a.b" }` - fence: the timeline waits for this frame

Rect numbers are px, `"NN%"` is percent of 1920x1080. Split screen = two clips with `w: "50%"`. Overlay on top = small rect + `zIndex: 10`.

## Clip types (common config)

- **title** - `title`, `subtitle?`. Centered title card.
- **code** - `steps` (code files, morphs between them), `key?` (chain continuity), `filename?`, `stepInterval?` (60), `transitionDuration?` (30), `transition?` ("token"/"line"), `scrollTo?`, `scrollDuration?`. Code annotations live in the code files as comments - see [rules/annotations.md](rules/annotations.md).
- **terminal** - `steps` (`{cwd?, command, output?[]}[]`), `typeSpeed?` (1), `pauseAfterCommand?` (15), `outputLineDelay?` (10), `showCursor?` (true).
- **video** - `src` (file in `video/`), `startFrom?`, `playbackRate?`, `muted?` (true), `loop?` (false).
- **overlay** - `text`, `title?`. Callout card; give it a small rect + `zIndex`.

Defaults in parentheses. Key chains: clips sharing `key` continue exactly where the previous ended (code step, scroll, rect, filename) - they must not overlap and must keep the same top-left corner.

## When the 80% path isn't enough

- Full storyboard reference (all end conditions, validation rules) - [rules/storyboard-format.md](rules/storyboard-format.md)
- Voiceover details (voices, cache, replacing the pipeline) - [rules/narration-and-voiceover.md](rules/narration-and-voiceover.md)
- Code annotations (mark, diff, focus, callout, twoslash) - [rules/annotations.md](rules/annotations.md)
- Debugging renders - [rules/verification.md](rules/verification.md)
- Per-clip deep dives - [rules/code-clip.md](rules/code-clip.md), [terminal-clip.md](rules/terminal-clip.md), [video-clip.md](rules/video-clip.md), [overlay-clip.md](rules/overlay-clip.md), [title-clip.md](rules/title-clip.md)
