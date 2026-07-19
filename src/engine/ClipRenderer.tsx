import {
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { rgba } from "polished";
import { useThemeColors } from "../calculate-metadata/theme";
import { textStyles, TITLE_BAR_HEIGHT } from "./clip-style";
import { resolveRectValue } from "./types";
import type { ClipComponent, Timeline, TimelineClip } from "./types";

const ClipPane: React.FC<{
  clip: TimelineClip;
  children: React.ReactNode;
}> = ({ clip, children }) => {
  // Clip-local frame (this component is inside the clip's Sequence)
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const themeColors = useThemeColors();

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

  // Optional pane title: chrome above the content, identical for every clip
  // type. Centered heading with a fading separator below (like the original
  // project's SceneTitle). The content area shrinks below it; clips fill
  // 100% of the remaining space, so they need no changes.
  const titleForeground = themeColors.editor.foreground;
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
          height: TITLE_BAR_HEIGHT,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            ...textStyles.heading2,
            textAlign: "center",
            color: titleForeground,
          }}
        >
          {clip.paneTitle}
        </div>
        <div
          style={{
            height: 2,
            marginTop: 12,
            background: `linear-gradient(90deg, transparent, ${rgba(titleForeground, 0.3)}, transparent)`,
          }}
        />
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
