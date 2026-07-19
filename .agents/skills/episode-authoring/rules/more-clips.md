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
