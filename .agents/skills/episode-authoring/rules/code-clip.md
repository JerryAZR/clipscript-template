# code clip

Code files morphing step by step inside a themed card, with annotations,
scrolling, and chain continuity.

```ts
{
  id: "code-1",
  type: "code",
  key: "main",                     // optional: chains state with other "main" clips
  steps: ["v1.ts", "v2.ts"],       // files in public/<episode>/code/
  filename: "users.ts",            // tab label (default: last step's basename)
  rect: rects.large,               // standard single window (from engine/clip-style)
  startAt: { line: "code.intro" },
  endAt: [{ line: "code.chain", end: true }],
}
```

## Config fields

- `steps` (required) - code states, morphing in order. After resolution a
  chained clip's `steps` gain the carry-in step from the previous clip.
- `key` - chain id. See "Key chains" in [storyboard-format.md](storyboard-format.md).
- `filename` - tab label.
- `stepInterval` - frames between morphs (default 60).
- `transitionDuration` - morph length (default 30).
- `transition` - `"token"` (default, fine-grained morph) or `"line"` (whole-line
  matching, survives big rewrites).
- `scrollTo` - rendered line to scroll to (1-based); `scrollDuration` (default
  30, 0 = snap). Initial scroll comes from the chain (default 0).
  When the file doesn't fit the pane, an editor-style overlay scrollbar
  appears on the right, tracking the scroll position.

## Align morphs with narration lines

Use a **key chain: one code clip per narration line, with one new step per
clip**. Do not put every version in one clip spanning several lines and
expect the steps to follow those lines - steps within a clip are paced only
by `stepInterval`, not by line boundaries.

Given one narration line per code state:

```toml
[[lines]]
id = "code.initial"
text = "Start with the basic implementation."

[[lines]]
id = "code.guard"
text = "Next, reject invalid input."

[[lines]]
id = "code.fallback"
text = "Finally, provide a fallback."
```

Build the morph as a chain:

```ts
const codeClips: Storyboard["clips"] = [
  {
    id: "code-initial",
    type: "code",
    key: "users",
    steps: ["v1.ts"],
    filename: "users.ts",
    rect: rects.large,
    startAt: { line: "code.initial" },
    endAt: [{ line: "code.initial", end: true }],
  },
  {
    id: "code-guard",
    type: "code",
    key: "users",
    steps: ["v2.ts"],          // resolved as ["v1.ts", "v2.ts"]
    stepInterval: 15,          // hold the carry-in, then start the morph
    transitionDuration: 15,
    startAt: { line: "code.guard" },
    endAt: [{ line: "code.guard", end: true }],
  },
  {
    id: "code-fallback",
    type: "code",
    key: "users",
    steps: ["v3.ts"],          // resolved as ["v2.ts", "v3.ts"]
    stepInterval: 15,
    transitionDuration: 15,
    startAt: { line: "code.fallback" },
    endAt: [{ line: "code.fallback", end: true }],
  },
];
```

The first clip establishes `v1.ts`. At `code.guard`, the chain carries in
`v1.ts`, holds it for 15 frames, then morphs to `v2.ts` over 15 frames. The
same happens from `v2.ts` to `v3.ts` at `code.fallback`. Later clips inherit
`rect` and `filename`; omit pane fades between chained clips so the code
surface stays seamless.

**`stepInterval` is the delay before the morph, not a narration anchor.** Its
default is 60 frames, which leaves a two-second hold at 30 fps. Shorten it for
an earlier morph and choose `transitionDuration` for the morph itself. These
are relative animation timings; never compute absolute frames to synchronize
steps with lines.

If a narration line might end before its morph finishes, add a fence so the
next line waits. For the 15 + 15-frame timing above:

```ts
endAt: [
  { line: "code.guard", end: true },
  { line: "code.guard", offsetFrames: 30, sync: "code.guard" },
],
```

A longer line still runs naturally; a shorter one is extended to frame 30.
Use `timeline-check.ts` and stills near each line boundary to verify the
carry-in, morph, and settled state.

## Content

- Syntax highlighting via Code Hike (TextMate grammars), language inferred
  from the file extension. Annotations as comments in the code files - see
  [annotations.md](annotations.md).

## Generating annotated steps

Hand-writing `!diff`/`!from` markers is mechanical - generate them from
pristine file versions instead and review the result in git diff:

```
npx tsx scripts/annotate-diff.mts --out public/<episode>/code/ v1.ts v2.ts [v3.ts ...]
npx tsx scripts/annotate-diff.mts --static --out public/<episode>/code/ v1.ts v2.ts
```

Default (animated) mode writes one annotated step file per input version.
`--static` writes one merged diff file per transition (`v2.ts + v3.ts ->
v3.diff.ts`): the full new file with removed lines inserted at their
positions, all marked - a "review this change" beat that drops into `steps`
like any other file. Options: `--threshold` (inline pairing sensitivity,
0.5), `--force` (overwrite). Inputs must be pristine and share one
extension; the summary printout lists every line-level fallback to review.

Source: `src/engine/clips/CodeClip.tsx`.
