import {
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useDimmedColor } from "../calculate-metadata/theme";
import { textStyles, TITLE_BAR_HEIGHT } from "./clip-style";
import { cardPadding } from "./code-style";
import type { ClipComponent, RectValue, Timeline, TimelineClip } from "./types";

const resolveRectValue = (value: RectValue, dimension: number): number => {
  if (typeof value === "number") {
    return value;
  }
  if (value.endsWith("%")) {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return (parsed / 100) * dimension;
    }
  }
  // The storyboard only allows numbers or "%"-strings - anything else is a bug
  throw new Error(
    `Invalid rect value ${JSON.stringify(value)}; expected a number or a percentage string.`,
  );
};

const ClipPane: React.FC<{
  clip: TimelineClip;
  children: React.ReactNode;
}> = ({ clip, children }) => {
  // Clip-local frame (this component is inside the clip's Sequence)
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dimmedTitle = useDimmedColor(0.3);

  const rect = clip.rect;
  if (!rect) {
    throw new Error(
      `clip '${clip.id}' has no rect (and none to inherit from its key chain).`,
    );
  }

  const transitionIn = clip.transitionIn ?? 0;
  const transitionOut = clip.transitionOut ?? 0;
  const exitStart = clip.endFrame - clip.startFrame;

  // Pane transition: fade-only for now. The enter/exit progress below is the
  // single extension point - position-based styles (slide/wipe/push) can be
  // added later by mapping the same progress to transforms via a per-clip
  // transition-style field, without touching the timeline or Sequence model.
  let opacity = 1;
  if (transitionIn > 0 && frame < transitionIn) {
    opacity = interpolate(frame, [0, transitionIn], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  }
  if (transitionOut > 0 && frame >= exitStart) {
    opacity *= interpolate(frame - exitStart, [0, transitionOut], [1, 0], {
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
  }

  // Optional pane title bar: chrome above the content, identical for every
  // clip type. The content area shrinks below it; clips fill 100% of the
  // remaining space, so they need no changes.
  const content = clip.paneTitle ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          ...textStyles.paneTitle,
          height: TITLE_BAR_HEIGHT,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: cardPadding,
          color: dimmedTitle,
        }}
      >
        {clip.paneTitle}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {children}
      </div>
    </div>
  ) : (
    children
  );

  return (
    <div
      style={{
        position: "absolute",
        left: resolveRectValue(rect.x, width),
        top: resolveRectValue(rect.y, height),
        width: resolveRectValue(rect.w, width),
        height: resolveRectValue(rect.h, height),
        overflow: "hidden",
        zIndex: clip.zIndex ?? 0,
        opacity,
      }}
    >
      {content}
    </div>
  );
};

export const ClipRenderer: React.FC<{
  timeline: Timeline;
  clipComponents: Record<string, ClipComponent>;
}> = ({ timeline, clipComponents }) => {
  return (
    <>
      {timeline.lines
        .filter((line) => line.audio !== null)
        .map((line) => (
          <Sequence
            key={line.fullId}
            from={line.startFrame}
            durationInFrames={line.endFrame - line.startFrame}
          >
            <Audio src={staticFile(line.audio!)} />
          </Sequence>
        ))}

      {timeline.clips.map((clip) => {
        const Component = clipComponents[clip.type];
        if (!Component) {
          throw new Error(
            `Unknown clip type '${clip.type}' (clip '${clip.id}'). Register it in the clipComponents map.`,
          );
        }
        return (
          <Sequence
            key={clip.id}
            from={clip.startFrame}
            durationInFrames={
              clip.endFrame - clip.startFrame + (clip.transitionOut ?? 0)
            }
            layout="none"
          >
            <ClipPane clip={clip}>
              <Component clip={clip} />
            </ClipPane>
          </Sequence>
        );
      })}
    </>
  );
};
