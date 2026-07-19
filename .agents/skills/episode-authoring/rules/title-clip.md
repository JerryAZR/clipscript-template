# title clip

Centered title + subtitle, fading/rising in after the pane transition.

```ts
{
  id: "intro-title",
  type: "title",
  title: "Clip Engine",
  subtitle: "Narration-driven videos",  // optional
  rect: { x: 0, y: 0, w: "100%", h: "100%" },
  startAt: { line: "intro.first" },
  endAt: [{ line: "intro.second", end: true }],
}
```

Uses the episode's theme colors and the shared Fira Code font. Works in any
rect - full screen for openers, small rects for banners and lower-thirds.
Source: `src/engine/clips/TitleClip.tsx`.
