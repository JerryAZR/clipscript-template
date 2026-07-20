# Authoring friction log

Pain points and frictions encountered while authoring the showcase episode -
the first real (non-fixture) use of the framework. These are optimization
candidates, not bugs.

- **Self-referential display assets drift.** To show this episode's own
  `narration.toml` / `storyboard.ts` in a code clip, the files must be copied
  into `public/showcase/code/` - the copies go stale the moment the real
  files change. Candidates: code clip `steps` accepting paths outside
  `code/`, a prepare-script that snapshots episode files, or a "raw text"
  clip field.

- **twoslash hard-fails on display files with imports.** Showing a real
  project file (storyboard.ts) in a code clip throws TwoslashError because
  `../../engine/types` can't resolve in the virtual FS. `// @errors: 2307`
  passes validation but the error still renders as a big red error
  annotation - the engine treats "expected" as "show it", which is right
  for the error-annotation demo but wrong for display files. Workaround:
  `// @ts-nocheck` as the copy's first line. Candidate: process-snippet
  respects @errors codes by NOT emitting error annotations for them, or
  gains a per-clip "no twoslash" flag for display-only files.

- **Clips have no natural-size feedback.** The progress-steps stepper is
  ~1000px wide intrinsically; in a 729px rect its first step was silently
  clipped by overflow: hidden. Neither TypeScript nor validation can catch
  it - only a rendered still does. Candidates: clips document their natural
  dimensions in their rules file, a validation warning when a known-wide
  clip gets a narrow rect, or clip-side scaling to fit.

- **Full renders can stall on font load.** The first full render of this
  episode died at frame 1616: `loadFont()`'s delayRender was not cleared
  within the 28s default (the font fetch stalled under full-render
  concurrency; stills never hit it). `--timeout=60000` got through.
  Candidates: set a higher puppeteer timeout in remotion.config.ts for
  everyone, or preload fonts earlier in the page lifecycle.
