# video clip

Embeds a screen recording, aligned to the clip's timeline window.

```ts
{
  id: "video-1",
  type: "video",
  src: "cargo-run.mp4",            // file in public/<episode>/video/
  rect: { x: "10%", y: "15%", w: "55%", h: "70%" },
  startAt: { line: "showcase.video" },
  endAt: [{ line: "showcase.overlay", end: true }],   // spanning lines is fine
}
```

## Config fields

- `src` (required) - video file in `public/<episode>/video/`.
- `startFrom` - skip this many frames of the recording (default 0).
- `playbackRate` - default 1.
- `muted` - default true.
- `loop` - default false.

Playback starts when the clip mounts and fits the pane (`objectFit: contain`)
inside a themed card matching the code clip. Uses `<Video>` from
`@remotion/media`. Source: `src/engine/clips/VideoClip.tsx`.
