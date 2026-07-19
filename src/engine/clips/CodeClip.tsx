import { useCardColor, useThemeColors } from "../../calculate-metadata/theme";
import { interpolate } from "remotion";
import { CodeTransition } from "../CodeTransition";
import { useHighlightedCode } from "../HighlightContext";
import {
  cardPadding,
  cardRadius,
  codeFontFamily,
  codeFontSize,
  lineHeightPx,
} from "../code-style";
import {
  defaultStepInterval,
  defaultTransitionDuration,
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
      }}
    >
      <div
        style={{
          padding: `${cardPadding / 2}px ${cardPadding}px`,
          fontSize: codeFontSize * 0.7,
          color: themeColors.editor.foreground,
          opacity: 0.6,
          userSelect: "none",
        }}
      >
        {clip.filename}
      </div>
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
    </div>
  );
};
