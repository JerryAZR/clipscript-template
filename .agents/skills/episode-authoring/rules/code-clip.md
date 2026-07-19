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
  rect: { x: "10%", y: "10%", w: "80%", h: "80%" },
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

- Syntax highlighting + twoslash (`^?` type callouts, error annotations) for
  ts/tsx; other languages by extension.
- Annotations as comments in the code files - see [annotations.md](annotations.md).
- Language is inferred from the file extension.

Source: `src/engine/clips/CodeClip.tsx`.
