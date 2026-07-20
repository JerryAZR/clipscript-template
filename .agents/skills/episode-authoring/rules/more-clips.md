# Additional clip types

Occasionally-useful clips beyond the core five. Same common fields (`rect`,
`startAt`, `endAt`, `transitionIn?`, `transitionOut?`, `zIndex?`) as every clip.

## animated-list

Bullet list whose items spring in one at a time.

- `items: string[]` - the bullets
- `stagger?` - frames between consecutive items (default 15)

If the clip's frame window is too short for `items.length * stagger`, the
effective stagger is compressed so the last item still appears before the clip
ends (never stretched to fill a long window). Keep lists short; one point per
item, matching the narration.

## progress

Outline checklist showing episode/section progress. Items can nest one level
via `children`.

- `title?` - heading above the list
- `items: { text, status, children? }[]` - status is `"done"` (checkmark,
  dimmed), `"current"` (accent highlight, pulsing marker) or `"todo"` (dimmed,
  empty marker)

Statuses are static per clip - to advance the "current" marker as the episode
progresses, use a sequence of progress clips anchored to successive lines,
each with updated statuses.

## countdown

Ring countdown timer: a ring sweeps each second, the remaining number counts
down, then a "GO!" springs in.

- `seconds?` - seconds to count down from (default 3)
- `goText?` - text shown when it finishes (default "GO!")

Rarely used in typical tutorials, but it is the natural way to demonstrate a
sync fence: end the clip with `offsetFrames` past the countdown's full length
plus a `sync` so the narration waits for zero:

```ts
{
  id: "count",
  type: "countdown",
  seconds: 3,
  rect: { x: "35%", y: "15%", w: "30%", h: "70%" },
  startAt: { line: "demo.countdown" },
  endAt: [{ line: "demo.countdown", offsetFrames: 140, sync: "demo.countdown" }],
}
```

## chapter-title

Numbered chapter card: small "Chapter" label, big springing number, extending
accent lines, chapter title below.

- `chapter: number` - the displayed number
- `title: string` - chapter title
- `label?` - the small uppercase label (default "Chapter")

Use for multi-chapter tutorials; distinct from `cinematic-title` (the episode
opener).

## notification-pop

Toast stack sliding in from the right, for "tests pass" / "CI green" beats.

- `notifications: { title, body?, color?, badge? }[]` - toasts in order;
  `color` is the avatar dot (default theme accent), `badge` shows a red count
  bubble
- `stagger?` - frames between toasts (default 20; compressed if the window is
  short, so no toast is ever dropped)

Toasts right-align inside the pane - give it a right-side rect. Heading text
belongs in `paneTitle`, not the clip.

## progress-steps

Horizontal stepper: numbered circles connected by filling lines, advancing
one step at a time (circle fills + pulses, connector sweeps to the next).

- `steps: string[]` - stage labels in order
- `title?` - heading above the stepper
- `stepInterval?` - frames per step (default 24; compressed if the window is
  short, so the stepper always completes)

Competes with `progress` (the vertical checklist) as the progress tracker:
`progress-steps` wins on animation quality, `progress` wins on hierarchy and
nesting. Both are ported; pick per episode, default TBD.
