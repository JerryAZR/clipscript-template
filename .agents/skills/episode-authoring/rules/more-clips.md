# Additional clip types

Occasionally-useful clips beyond the core five. Same common fields (`rect`,
`startAt`, `endAt`, `transitionIn?`, `transitionOut?`, `zIndex?`) as every clip.

## cinematic-title

Full-pane episode/chapter opener: title springs up, an accent underline grows,
subtitle fades in. All choreography is fixed; there is nothing to tune.

```ts
{
  id: "opener",
  type: "cinematic-title",
  title: "Building the Engine",
  subtitle: "part 2",              // optional
  rect: { x: 0, y: 0, w: "100%", h: "100%" },
  startAt: { line: "intro.first" },
  endAt: [{ line: "intro.first", end: true }],
}
```

Give it a line of its own and a full-screen rect - overlapping it with other
clips defeats the purpose.

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
