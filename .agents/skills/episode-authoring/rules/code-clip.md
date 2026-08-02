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
