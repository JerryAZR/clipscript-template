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
