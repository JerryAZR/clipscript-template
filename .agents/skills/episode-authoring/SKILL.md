---
name: episode-authoring
description: Authoring tutorial/dev-log video episodes - narration script, storyboard clips, voiceover, verification
metadata:
  tags: episode, narration, storyboard, clips, voiceover, tutorial
---

## When to use

Use this skill when creating or editing an episode: the narration script, the storyboard (clips), code/video assets, voiceover, or when checking that an episode renders correctly.

## How an episode works

An episode is a folder under `public/<episode>/` plus a storyboard at `src/episodes/<episode>/storyboard.ts`, registered in `src/episodes/registry.ts`.

The pipeline:

1. `public/<episode>/narration.toml` holds the script: a flat `[[lines]]` list with `id` + `text`. Narration lines are the master clock of the whole video.
2. `npx tsx scripts/tts.mts --episode <name>` synthesizes one mp3 per line into `voiceover/` (edge-tts, content-hash cached - only changed lines regenerate).
3. At load time, `calculateMetadata` measures each line's audio duration (estimated from text length when the mp3 is missing, so silent episodes still render) and compiles the storyboard into an absolute frame timeline.
4. Each clip is mounted in a `<Sequence>` at its computed window, placed in its `rect` pane, stacked by `zIndex`.

Storyboard clips are plain typed objects referencing line ids - never frames:

```ts
{
  id: "main-code",
  type: "code",
  key: "main",                    // chains code state with other "main" clips
  steps: ["v1.ts", "v2.ts"],      // files in public/<episode>/code/
  rect: { x: "10%", y: "10%", w: "80%", h: "80%" },
  startAt: { line: "code.intro" },
  endAt: [{ line: "code.chain", end: true }],
}
```

## Clip types

- **title** - centered title + subtitle. See [rules/title-clip.md](rules/title-clip.md)
- **code** - code files morphing step by step, with annotations, scrolling and key-chained continuity. See [rules/code-clip.md](rules/code-clip.md)
- **terminal** - simulated command typing + output. See [rules/terminal-clip.md](rules/terminal-clip.md)
- **video** - timeline-aligned screen recordings. See [rules/video-clip.md](rules/video-clip.md)
- **overlay** - callout card stacked on other clips via zIndex. See [rules/overlay-clip.md](rules/overlay-clip.md)

## Key concepts

- **Anchoring**: `startAt = { line, offsetFrames? }`; `endAt` is a list of conditions - `{ line, offsetFrames? }`, `{ line, end: true }` (until that line finishes), optionally with `sync` (the timeline waits: later lines don't start until the condition's frame is reached). A clip can span as many lines as needed.
- **Key chains**: code clips sharing a `key` continue exactly where the previous one left off (code step, scroll position, rect, filename tab). Chained clips must not overlap (including transition tails), and their top-left corners must match.
- **Transitions**: the renderer fades panes in/out over `transitionIn`/`transitionOut` frames. Clips never animate their own entrance opacity - their content animation starts after the pane arrives.
- **Durations**: measured from voiceover mp3s when present, estimated otherwise. Re-run `tts.mts` after editing `narration.toml`; the timeline follows automatically.

## References

- Storyboard format and all clip config fields - [rules/storyboard-format.md](rules/storyboard-format.md)
- Narration format, voiceover pipeline, durations - [rules/narration-and-voiceover.md](rules/narration-and-voiceover.md)
- Code annotations (mark, diff, focus, callout, twoslash) - [rules/annotations.md](rules/annotations.md)
- Verifying renders, stills, smoke tests - [rules/verification.md](rules/verification.md)
