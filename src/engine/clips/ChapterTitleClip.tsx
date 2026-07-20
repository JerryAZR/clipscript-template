import { interpolate, spring, useVideoConfig } from "remotion";
import { useAccentColor, useDimmedColor, useThemeColors } from "../../calculate-metadata/theme";
import { centeredPaneStyle, textStyles } from "../clip-style";
import type { ChapterTitleClipDef, ClipComponent } from "../types";
import { useClipFrame } from "../useClipFrame";

/**
 * Numbered chapter card: small uppercase label fades in, the chapter number
 * springs into place, accent lines extend out from a center dot, then the
 * chapter title fades/rises in below. The renderer owns the pane enter/exit
 * transition - this clip only animates its own content, starting once the
 * pane has fully arrived.
 */
export const ChapterTitleClip: ClipComponent<ChapterTitleClipDef> = ({
  clip,
}) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included) - no whole-pane opacity animation here
  const frame = useClipFrame(clip.transitionIn);
  const { fps } = useVideoConfig();
  const themeColors = useThemeColors();

  const foreground = themeColors.editor.foreground;
  const accent = useAccentColor();
  const labelColor = useDimmedColor(0.4);
  const titleColor = useDimmedColor(0.25);

  const numberScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const labelOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [10, 40], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [20, 40], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        ...centeredPaneStyle,
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          ...textStyles.caption,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: labelColor,
          opacity: labelOpacity,
        }}
      >
        {clip.label ?? "Chapter"}
      </div>
      <div
        style={{
          ...textStyles.display,
          fontWeight: 800,
          lineHeight: 1,
          marginTop: 8,
          color: foreground,
          transform: `scale(${numberScale})`,
        }}
      >
        {clip.chapter}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginTop: 24,
        }}
      >
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: accent,
          }}
        />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: accent,
            opacity: labelOpacity,
          }}
        />
        <div
          style={{
            width: lineWidth,
            height: 1,
            backgroundColor: accent,
          }}
        />
      </div>
      <div
        style={{
          ...textStyles.subtitle,
          fontWeight: 300,
          letterSpacing: "0.1em",
          marginTop: 16,
          color: titleColor,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        {clip.title}
      </div>
    </div>
  );
};
