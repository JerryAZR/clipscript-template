# cinematic-title clip

The default title page. Full-pane opener: the title springs up into place,
an accent underline grows beneath it, then the subtitle fades in. All
choreography is fixed - there is nothing to tune.

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
clips defeats the purpose. For small in-pane labels or banners use `overlay`
instead; for a page title above cooperating panes use `paneTitle`.

Source: `src/engine/clips/CinematicTitleClip.tsx`.
