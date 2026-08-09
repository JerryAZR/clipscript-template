# Verification

## Quick visual check

Render single frames and look at them (`<Comp>` is the episode name with `/`
replaced by `-`, e.g. `examples-showcase`; your own episodes render as-is):

```bash
npx remotion still <Comp> out/check.png --frame=200
```

Get frame numbers from the timeline instead of guessing:

```bash
npx tsx scripts/timeline-check.ts <episode>   # prints every line and clip's frame range
```

## Automated checks

- `npm run lint` - tsc + eslint (always run after engine changes).
- `npm run test:unit` - fast vitest unit tests for the pure engine core
  (timeline, code-state, narration).
- `npm run test:smoke` - renders the kitchen-sink fixture and asserts frame
  invariants (colors, continuity, morphs, scroll, clip presence). Slow (~30s),
  run it after changing clips, the fixture storyboard, or the renderer.

## Common failure modes

- **"startAt references unknown line"** - typo or renamed id in narration.toml.
- **"clips 'a' and 'b' (key 'k') overlap"** - chained clips touching; end the
  first earlier or remove the cross-fade (`transitionOut`).
- **Blank pane at clip start** - a mount-time measurement bug; DOM measurement
  must happen per-frame or after visibility (Remotion premounts offscreen).
- **Cryptic smol-toml/zod error** - malformed narration.toml; the error path
  names the episode but not the line - check recent edits first.
- **Missing voiceover** - re-run `npx tsx scripts/tts.mts --episode <name>`;
  check for `FAIL` lines in its output.
