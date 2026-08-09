import { rgba, readableColor } from "polished";
import { useCurrentFrame } from "remotion";
import { useThemeColors } from "../calculate-metadata/theme";
import { textStyles } from "./clip-style";
import type { TimelineLine } from "./types";

/**
 * The subtitle band: the active line's text, bottom-center, on top of all
 * clips. Not a clip - engine chrome driven directly by the timeline. Lines
 * with `subtitle = false` in subtitles.toml are skipped. Authors keep the
 * bottom ~10% clear when an episode enables subtitles.
 */
export const SubtitleBand: React.FC<{ lines: TimelineLine[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const themeColors = useThemeColors();
  const line = lines.find(
    (l) => l.subtitle && frame >= l.startFrame && frame < l.endFrame,
  );
  if (!line) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 20,
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          ...textStyles.body,
          maxWidth: "90%",
          textAlign: "center",
          color: readableColor(themeColors.background),
          backgroundColor: rgba(themeColors.background, 0.75),
          borderRadius: 12,
          padding: "10px 24px",
        }}
      >
        {line.text}
      </div>
    </div>
  );
};
