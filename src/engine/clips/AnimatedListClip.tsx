import { interpolate, spring, useVideoConfig } from "remotion";
import { useAccentColor, useThemeColors } from "../../calculate-metadata/theme";
import { textStyles } from "../clip-style";
import type { AnimatedListClipDef, ClipComponent } from "../types";
import { useClipFrame } from "../useClipFrame";

/**
 * Pure frame math: the clip-local frame at which each list item starts
 * appearing. Items start every `stagger` frames (default 15). If the
 * line window is too short for items x stagger, the stagger is
 * compressed (never stretched) so the last item still starts inside the
 * window: items appear faster, they never start after the clip has ended.
 * Deterministic: no randomness, no time, same inputs always yield the same
 * starts.
 */
export const itemStartFrames = (
  itemCount: number,
  stagger: number | undefined,
  durationFrames: number,
): number[] => {
  if (itemCount <= 0) {
    return [];
  }
  if (itemCount === 1) {
    return [0];
  }
  const requested = Math.max(0, stagger ?? 15);
  // (itemCount - 1) gaps must fit inside [0, durationFrames - 1]
  const fitsInWindow = Math.max(
    0,
    Math.floor((Math.max(0, durationFrames) - 1) / (itemCount - 1)),
  );
  const effectiveStagger = Math.min(requested, fitsInWindow);
  return Array.from({ length: itemCount }, (_, i) => i * effectiveStagger);
};

export const AnimatedListClip: ClipComponent<AnimatedListClipDef> = ({
  clip,
}) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included) - only per-item reveals are animated here
  const frame = useClipFrame(clip.transitionIn);
  const { fps } = useVideoConfig();
  const themeColors = useThemeColors();

  const durationFrames = clip.endFrame - clip.startFrame;
  const starts = itemStartFrames(
    clip.items.length,
    clip.stagger,
    durationFrames,
  );

  const textColor = themeColors.editor.foreground;
  const bulletColor = useAccentColor();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 28,
        padding: "0 64px",
        color: textColor,
      }}
    >
      {clip.items.map((item, i) => {
        // spring() handles negative frames, but clamp anyway so the start
        // offset stays an explicit part of the math
        const progress = spring({
          frame: Math.max(0, frame - starts[i]),
          fps,
          from: 0,
          to: 1,
          config: { damping: 14, mass: 0.6 },
        });
        const opacity = interpolate(progress, [0, 0.6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateX = interpolate(progress, [0, 1], [-32, 0]);

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              ...textStyles.body,
              opacity,
              transform: `translateX(${translateX}px)`,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: bulletColor,
              }}
            />
            <span>{item}</span>
          </div>
        );
      })}
    </div>
  );
};
