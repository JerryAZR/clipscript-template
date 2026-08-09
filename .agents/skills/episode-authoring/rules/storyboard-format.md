# Storyboard format

A storyboard (`src/episodes/<episode>/storyboard.ts`) exports `{ clips: StoryboardClip[] }`.
Clips are plain typed objects - TypeScript validates them as you write.

## Background (optional)

```ts
export const storyboard: Storyboard = {
  background: { src: "bg.png", dim: 0.7, saturate: 0.5 },
  clips: [...],
};
```

An episode-level backdrop image (`public/<episode>/images/<src>`), rendered
under all clips with a cover fit. Keep it non-disturbing: `dim` (0-1 dark
scrim), `saturate` (0-1), `brightness` pull a colorful source back so pane
content stays the focus. Omit it for the flat theme background.

## Fields every clip has

```ts
{
  id: string;                  // unique in the storyboard; used in errors
  type: "cinematic-title" | "code" | "terminal" | "video" | "overlay" | "animated-list" | "progress";
  rect?: Rect;                 // { x, y, w, h } - numbers are px, "NN%" of the composition
  zIndex?: number;             // stacking order for overlapping panes
  startAt: { line: string; offsetFrames?: number };
  endAt: ClipEndCondition[];
  transitionIn?: number;       // fade-in length in frames (default 0)
  transitionOut?: number;      // fade-out tail after endFrame (default 0)
}
```

## End conditions

`endAt` is a list; the clip ends at the **max** of all conditions:

- `{ line: "a.b" }` - when line `a.b` starts (plus optional `offsetFrames`)
- `{ line: "a.b", offsetFrames: 20 }` - 20 frames after `a.b` starts
- `{ line: "a.b", end: true }` - when line `a.b` finishes (cannot combine with offsetFrames)
- `{ line: "a.b", offsetFrames: 150, sync: "a.b" }` - a **fence**: the next line may
  not start until that frame is reached. Use when a visual needs more time than
  the narration gives it.

Unknown line ids, `end: true` with offset, sync-before-line, and zero/negative
clip duration are all hard errors at load time, naming the clip.

## Rects

Prefer the standard presets from `rects` in `src/engine/clip-style.ts`
(`full`, `large`, `medium`, `splitLeft`, `splitRight`) over hand-written
values. Custom rects: numbers are pixels, `"NN%"` strings are percent of the
composition (1920x1080) - use them for inset cards and asymmetric layouts,
not to re-invent a standard size. A small rect + `zIndex: 10` stacks a card
on top. `rect` is optional on keyed code clips (inherited from the chain)
and required otherwise.

## Key chains (code clips)

Clips sharing `key` form a chain in timeline order. A chained clip inherits the
previous clip's final state unless it overrides: carry-in code step (prepended
to `steps`), scroll position, `rect`, `filename`. Rules (validated at load):

- Chained clips must not overlap, including `transitionOut` tails (no cross-fades).
- If both clips specify a rect, their top-left corners must match (warning).

## Transitions

`transitionIn`/`transitionOut` fade the whole pane (renderer-owned). Adjacent
chained clips use none - continuity must look seamless.
