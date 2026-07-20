import { interpolate, spring, useVideoConfig } from "remotion";
import { useAccentColor, useDimmedColor, useThemeColors } from "../../calculate-metadata/theme";
import { textStyles } from "../clip-style";
import type { ClipComponent, CountdownClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";

const RADIUS = 180;
const SIZE = 440;
const STROKE = 16;

/**
 * Countdown timer: a ring sweeps each second while the remaining number
 * counts down, then a "GO!" springs in. Pair it with a sync fence in the
 * storyboard to hold the timeline until the countdown finishes.
 * Ported from the RVE countdown-intro template.
 */
export const CountdownClip: ClipComponent<CountdownClipDef> = ({ clip }) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included)
  const frame = useClipFrame(clip.transitionIn);
  const { fps } = useVideoConfig();
  const themeColors = useThemeColors();

  const accent = useAccentColor();
  const foreground = themeColors.editor.foreground;
  const track = useDimmedColor(0.85);

  const seconds = clip.seconds ?? 3;
  const totalFrames = seconds * fps;
  const current = Math.max(seconds - Math.floor(frame / fps), 0);
  const done = frame >= totalFrames;

  const ringProgress = (frame % fps) / fps;
  const circumference = 2 * Math.PI * RADIUS;
  const dashOffset = done ? circumference : circumference * ringProgress;

  const goScale = spring({
    frame: Math.max(frame - totalFrames, 0),
    fps,
    config: { damping: 8, stiffness: 100 },
  });
  const goOpacity = interpolate(frame, [totalFrames, totalFrames + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={track}
            strokeWidth={STROKE}
          />
          {!done && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={accent}
              strokeWidth={STROKE}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          )}
        </svg>
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: done
              ? `translate(-50%, -50%) scale(${goScale})`
              : "translate(-50%, -50%)",
            ...(done ? textStyles.heading1 : textStyles.display),
            color: done ? accent : foreground,
            opacity: done ? goOpacity : 1,
          }}
        >
          {done ? (clip.goText ?? "GO!") : current}
        </span>
      </div>
    </div>
  );
};
