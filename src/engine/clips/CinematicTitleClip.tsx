import { interpolate, spring, useVideoConfig } from "remotion";
import { useDimmedColor, useThemeColors } from "../../calculate-metadata/theme";
import { centeredPaneStyle, textStyles } from "../clip-style";
import type { ClipComponent, CinematicTitleClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";

/**
 * Cinematic episode opener: full-pane title card. The title springs up into
 * place, an accent underline grows out beneath it, then the subtitle fades in.
 * The renderer owns the pane enter/exit transition - this clip only animates
 * its own content, starting once the pane has fully arrived.
 */
export const CinematicTitleClip: ClipComponent<CinematicTitleClipDef> = ({
  clip,
}) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included) - no whole-pane opacity animation here
  const frame = useClipFrame(clip.transitionIn);
  const { fps } = useVideoConfig();
  const themeColors = useThemeColors();

  const foreground = themeColors.editor.foreground;
  const accent = themeColors.editor.infoForeground;
  const subtitleColor = useDimmedColor(0.25);

  const titleY = spring({
    frame,
    fps,
    from: 48,
    to: 0,
    durationInFrames: 40,
    config: { damping: 14, mass: 0.8 },
  });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const underlineWidth = interpolate(frame, [18, 42], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(frame, [34, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [34, 54], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        ...centeredPaneStyle,
        textAlign: "center",
      }}
    >
      <div
        style={{
          ...textStyles.display,
          letterSpacing: "0.04em",
          color: foreground,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        {clip.title}
      </div>
      <div
        style={{
          width: `${underlineWidth}%`,
          maxWidth: 480,
          height: 4,
          marginTop: 24,
          borderRadius: 2,
          backgroundColor: accent,
        }}
      />
      {clip.subtitle ? (
        <div
          style={{
            ...textStyles.subtitle,
            letterSpacing: "0.08em",
            marginTop: 28,
            color: subtitleColor,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          {clip.subtitle}
        </div>
      ) : null}
    </div>
  );
};
