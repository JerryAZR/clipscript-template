import { darken, mix, readableColor, rgba } from "polished";
import { Easing, interpolate } from "remotion";
import { useThemeColors } from "../../calculate-metadata/theme";
import { fontFamily } from "../../font";
import type { ClipComponent, OverlayClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";

/**
 * Overlay card: a compact themed callout for tips, comparisons, or notes,
 * stacked above code/video via a small rect + zIndex. The renderer owns the
 * pane opacity transition - this clip only animates its content (a gentle
 * rise/settle) once the pane has arrived.
 */
export const OverlayClip: ClipComponent<OverlayClipDef> = ({ clip }) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included) - no opacity animation here
  const frame = useClipFrame(clip.transitionIn);
  const themeColors = useThemeColors();

  const foreground = readableColor(themeColors.background);
  const cardBackground = mix(0.08, foreground, themeColors.background);
  const borderColor = rgba(mix(0.5, foreground, themeColors.background), 0.3);
  const shadowColor = rgba(darken(0.15, themeColors.background), 0.5);

  const translateY = interpolate(frame, [0, 15], [16, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        backgroundColor: cardBackground,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: "24px 32px",
        fontFamily,
        color: foreground,
        boxShadow: `0 8px 32px ${shadowColor}`,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {clip.title ? (
        <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
          {clip.title}
        </div>
      ) : null}
      <div style={{ fontSize: 30, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        {clip.text}
      </div>
    </div>
  );
};
