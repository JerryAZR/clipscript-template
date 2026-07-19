# overlay clip

A themed callout card for notes, tips, and asides, stacked above other clips.

```ts
{
  id: "overlay-1",
  type: "overlay",
  title: "Note",                   // optional
  text: "Overlay cards stack on top\nfor tips and callouts.",
  rect: { x: "55%", y: "55%", w: "35%", h: "25%" },
  zIndex: 10,                      // above the base panes
  startAt: { line: "showcase.overlay" },
  endAt: [{ line: "showcase.overlay", end: true }],
}
```

## Config fields

- `text` (required) - body, `whiteSpace: pre-wrap` (`\n` works).
- `title` - optional bold heading.

Content rises gently into place after the pane transition; colors derive from
the episode theme. Source: `src/engine/clips/OverlayClip.tsx`.
