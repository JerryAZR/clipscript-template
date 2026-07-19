import { interpolate } from "remotion";
import { useThemeColors } from "../../calculate-metadata/theme";
import { fontFamily } from "../../font";
import type { ClipComponent, TitleClipDef } from "../types";
import { useClipFrame } from "../useClipFrame";

export const TitleClip: ClipComponent<TitleClipDef> = ({ clip }) => {
  // Content choreography starts after the pane transition (which the renderer
  // owns, opacity included) - no opacity animation here
  const frame = useClipFrame(clip.transitionIn);
  const themeColors = useThemeColors();

  const translateY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        color: themeColors.editor.foreground,
        transform: `translateY(${translateY}px)`,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 700 }}>{clip.title}</div>
      {clip.subtitle ? (
        <div style={{ fontSize: 36, opacity: 0.7, marginTop: 16 }}>
          {clip.subtitle}
        </div>
      ) : null}
    </div>
  );
};
