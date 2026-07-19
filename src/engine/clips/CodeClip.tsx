import { useCardColor, useThemeColors } from "../../calculate-metadata/theme";
import { rgba } from "polished";
import { interpolate, useVideoConfig } from "remotion";
import { CodeTransition } from "../CodeTransition";
import { useHighlightedCode } from "../HighlightContext";
import { TITLE_BAR_HEIGHT } from "../clip-style";
import { CardHeader } from "./CardHeader";
import {
  cardPadding,
  cardRadius,
  codeFontFamily,
  codeTabHeight,
  lineHeightPx,
} from "../code-style";
import {
  defaultStepInterval,
  defaultTransitionDuration,
  resolveRectValue,
} from "../types";
import type { ClipComponent, CodeClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";

export const CodeClip: ClipComponent<CodeClipDef> = ({ clip }) => {
  const frame = useClipFrame(clip.transitionIn);
  const themeColors = useThemeColors();
  const highlightedCode = useHighlightedCode();

  const stepInterval = clip.stepInterval ?? defaultStepInterval;
  const transitionDuration = clip.transitionDuration ?? defaultTransitionDuration;
  const stepIndex = Math.min(
    Math.floor(frame / stepInterval),
    clip.steps.length - 1,
  );
  const stepFrame = frame - stepIndex * stepInterval;

  const currentSrc = clip.steps[stepIndex];
  // Step 0 morphs from itself (visually static), later steps from their predecessor
  const prevSrc = stepIndex > 0 ? clip.steps[stepIndex - 1] : currentSrc;
  const code = highlightedCode[currentSrc];
  const prevCode = highlightedCode[prevSrc];
  if (!code || !prevCode) {
    throw new Error(
      `clip '${clip.id}': step '${!code ? currentSrc : prevSrc}' was not pre-highlighted`,
    );
  }
  if (!clip.filename) {
    throw new Error(
      `clip '${clip.id}': code clip has no filename after state resolution`,
    );
  }

  const scrollFrom = clip.scrollFrom ?? 0;
  const scrollTarget = clip.scrollTo ?? scrollFrom;
  const scrollDuration = clip.scrollDuration ?? 30;
  const scrollProgress =
    scrollDuration === 0
      ? 1
      : interpolate(frame, [0, scrollDuration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const scrollLine = scrollFrom + (scrollTarget - scrollFrom) * scrollProgress;
  const scrollPx = Math.max(0, scrollLine - 1) * lineHeightPx;

  // Editor-style overlay scrollbar (macOS/GNOME: thin thumb, no track),
  // shown only when the file doesn't fit in the pane. All geometry derives
  // from the same constants as the scroll itself - no DOM measurement.
  const { height: videoHeight } = useVideoConfig();
  if (!clip.rect) {
    throw new Error(`clip '${clip.id}': code clip has no rect after resolution`);
  }
  const paneHeight = resolveRectValue(clip.rect.h, videoHeight);
  const contentHeight =
    paneHeight - codeTabHeight - (clip.paneTitle ? TITLE_BAR_HEIGHT : 0);
  const totalLines = code.code.split("\n").length;
  const fileHeight = totalLines * lineHeightPx;
  const maxScrollPx = Math.max(0, fileHeight - contentHeight);
  const thumbHeight = Math.max(
    24,
    (contentHeight * contentHeight) / fileHeight,
  );
  const thumbTop =
    maxScrollPx > 0
      ? // Clamp: an over-scrolling scrollTo shows bottom whitespace (fine),
        // but the thumb must never leave the track
        Math.min(1, scrollPx / maxScrollPx) * (contentHeight - thumbHeight)
      : 0;
  const showScrollbar = fileHeight > contentHeight;

  const cardBackground = useCardColor();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: cardBackground,
        borderRadius: cardRadius,
        overflow: "hidden",
        fontFamily: codeFontFamily,
        position: "relative",
      }}
    >
      <CardHeader title={clip.filename} icon="file" />
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            transform: `translateY(${-scrollPx}px)`,
            padding: `0 ${cardPadding}px`,
          }}
        >
          <CodeTransition
            key={stepIndex}
            oldCode={prevCode}
            newCode={code}
            frame={stepFrame}
            durationInFrames={transitionDuration}
            transition={clip.transition ?? "token"}
          />
        </div>
      </div>
      {showScrollbar ? (
        <div
          style={{
            position: "absolute",
            top: codeTabHeight + thumbTop,
            right: 3,
            width: 6,
            height: thumbHeight,
            borderRadius: 3,
            backgroundColor: rgba(themeColors.editor.foreground, 0.3),
          }}
        />
      ) : null}
    </div>
  );
};
