---
name: remotion-best-practices
description: Best practices for Remotion - Video creation in React
metadata:
  tags: remotion, video, react, animation, composition
---

## When to use

Use this skills whenever you are dealing with Remotion code to obtain the domain-specific knowledge.

## Designing a video

Animate properties using `useCurrentFrame()` and `interpolate()`. Use Easing to customize the timing of the animation.

```tsx
import { useCurrentFrame, Easing } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return <div style={{ opacity }}>Hello World!</div>;
};
```

CSS transitions or animations are FORBIDDEN - they will not render correctly.
Tailwind animation class names are FORBIDDEN - they will not render correctly.

Place assets in the `public/` folder at your project root, and reference them with `staticFile()`.

Add images using the `<Img>` component:

```tsx
import { Img, staticFile } from "remotion";

export const MyComposition = () => {
  return <Img src={staticFile("logo.png")} style={{ width: 100, height: 100 }} />;
};
```

Add videos (e.g. screen recordings) using the `<Video>` component from `@remotion/media`:

```tsx
import { Video } from "@remotion/media";
import { staticFile } from "remotion";

export const MyComposition = () => {
  return <Video src={staticFile("recording.mp4")} />;
};
```

Audio works the same way via `<Audio>` from `@remotion/media`. Assets can also be remote URLs passed directly to `src`.

To delay content wrap it in `<Sequence>` and use `from`.
To limit the duration of an element, use `durationInFrames` of `<Sequence>`.
`<Sequence>` by default is an absolute fill. For inline content, use `layout="none"`.

```tsx
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";

const Main = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Sequence>
        <Background />
      </Sequence>
      <Sequence from={1 * fps} durationInFrames={2 * fps} layout="none">
        <Title />
      </Sequence>
      <Sequence from={2 * fps} durationInFrames={2 * fps} layout="none">
        <Subtitle />
      </Sequence>
    </AbsoluteFill>
  );
};
```

Inside a `<Sequence>`, `useCurrentFrame()` starts at 0 relative to the sequence start, so animations like the fade-in above keep working unchanged.

The width, height, fps, and duration of a video is defined in `src/Root.tsx`:

```tsx
import { Composition } from "remotion";
import { MyComposition } from "./MyComposition";

export const RemotionRoot = () => {
  return (
    <Composition
      id="MyComposition"
      component={MyComposition}
      durationInFrames={100}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};
```

Duration, dimensions and props can also be calculated dynamically via `calculateMetadata` on `<Composition>` - e.g. deriving `durationInFrames` from the length of the content being shown. This project has its own implementation in `src/calculate-metadata/` - prefer reusing it. See [rules/calculate-metadata.md](rules/calculate-metadata.md) for details.

## Starting preview

Start the Remotion Studio to preview a video:

```bash
npx remotion studio
```

## Optional: one-frame render check

You can render a single frame with the CLI to sanity-check layout, colors, or timing.
Skip it for trivial edits, pure refactors, or when you already have enough confidence from Studio or prior renders.

```bash
npx remotion still [composition-id] --scale=0.25 --frame=30
```

At 30 fps, `--frame=30` is the one-second mark (`--frame` is zero-based).

## Captions

When dealing with captions or subtitles, load the [./rules/subtitles.md](./rules/subtitles.md) file for more information.

## Advanced compositions

See [rules/compositions.md](rules/compositions.md) for how to define stills, folders, default props and for how to nest compositions.

## Fonts

Prefer local fonts: place the files in `public/` and load them with `@remotion/fonts` - no network dependency, so renders are reproducible and work offline. See [rules/local-fonts.md](rules/local-fonts.md). This template loads a local Fira Code in `src/font.ts`.

Google Fonts ([rules/google-fonts.md](rules/google-fonts.md)) are an alternative, but the font is fetched over the network at render time, which can fail or flake in restricted networks.

## Measuring text

See [rules/measuring-text.md](rules/measuring-text.md) for measuring text dimensions, fitting text to containers, and checking overflow.

## Advanced sequencing

See [rules/sequencing.md](rules/sequencing.md) for more sequencing patterns - delay, trim, limit duration of items.

## TailwindCSS

See [rules/tailwind.md](rules/tailwind.md) for using TailwindCSS in Remotion.

## Text animations

See [rules/text-animations.md](rules/text-animations.md) for typography and text animation patterns.

## Advanced timing

See [rules/timing.md](rules/timing.md) for advanced timing with `interpolate` and Bézier easing, and springs.

## Transitions

See [rules/transitions.md](rules/transitions.md) for scene transition patterns.

## Other topics

Less commonly needed features - load the rule file only when the task calls for it:

- Advanced video embedding (trim, loop, volume, speed, pitch): [rules/videos.md](rules/videos.md), [rules/trimming.md](rules/trimming.md)
- Advanced audio (trim, volume, speed, pitch, duration): [rules/audio.md](rules/audio.md), [rules/get-audio-duration.md](rules/get-audio-duration.md)
- Video metadata (dimensions, duration): [rules/get-video-dimensions.md](rules/get-video-dimensions.md), [rules/get-video-duration.md](rules/get-video-duration.md)
- FFmpeg operations, silence detection: [rules/ffmpeg.md](rules/ffmpeg.md), [rules/silence-detection.md](rules/silence-detection.md)
- Sound effects: [rules/sfx.md](rules/sfx.md)
- Voiceover: this template generates voiceover audio locally with edge-tts (`scripts/tts.mts`) - prefer it for drafts. See [rules/voiceover.md](rules/voiceover.md) for the ElevenLabs pattern when high-quality TTS is needed
- Audio visualization: [rules/audio-visualization.md](rules/audio-visualization.md)
- Advanced images (sizing, dynamic paths, dimensions): [rules/images.md](rules/images.md)
- GIFs: [rules/gifs.md](rules/gifs.md)
- Measuring DOM nodes: [rules/measuring-dom-nodes.md](rules/measuring-dom-nodes.md)
- Parameterized videos (Zod schema): [rules/parameters.md](rules/parameters.md)
- Transparent videos: [rules/transparent-videos.md](rules/transparent-videos.md)
- 3D content (Three.js / React Three Fiber): [rules/3d.md](rules/3d.md)
- Lottie animations: [rules/lottie.md](rules/lottie.md)
- Light leaks: [rules/light-leaks.md](rules/light-leaks.md)
- HTML in canvas: [rules/html-in-canvas.md](rules/html-in-canvas.md)
- Maps: [rules/maplibre.md](rules/maplibre.md)
