# Authoring friction log

Pain points and frictions encountered while authoring the showcase episode -
the first real (non-fixture) use of the framework. These are optimization
candidates, not bugs. Dispositions from discussion are noted inline.

- ~~**Self-referential display assets drift.**~~ RESOLVED (wontfix): a rare
  need; users can copy files into `code/` themselves. No framework support
  required.

- **twoslash hard-fails on display files with imports.** Showing a real
  project file (storyboard.ts) in a code clip throws TwoslashError because
  `../../engine/types` can't resolve in the virtual FS. `// @errors: 2307`
  passes validation but the error still renders as a big red error
  annotation - the engine treats "expected" as "show it", which is right
  for the error-annotation demo but wrong for display files. RESOLVED:
  process-snippet skips the compile entirely for files starting with
  `// @ts-nocheck` (display-only: pure highlighting, no callouts/errors).

- **Clips have no natural-size feedback.** The progress-steps stepper lays
  out at fixed pixel widths (160px per step column + 120px per connector,
  ~1000px for 4 steps) and ClipPane clips with `overflow: hidden` - in a
  729px rect the first step was silently cut off; only a rendered still
  showed it. RESOLVED (for now): natural width documented in the clip's
  rules file. Open candidates if it bites again: clip-side scale-to-fit
  (the clip can resolve its own rect against the video config, like the
  code clip's scrollbar math does), or a naturalSize declaration the
  validator can check against rects.

- **Full renders can stall on font load.** The first full render of this
  episode died at frame 1616: `loadFont()`'s delayRender was not cleared
  within the 28s default - the ttf fetch from the bundle server stalled
  under full-render concurrency (many tabs fetching mp3s, ts-lib files and
  the font at once; stills never hit it). A delayRender timeout is a hard
  failure of the whole render, not a degraded continuation. RESOLVED
  (masked): `Config.setDelayRenderTimeoutInMilliseconds(60000)` in
  remotion.config.ts. If stalls recur, the real suspect is the bundle
  server's behavior under load, not the timeout value.
