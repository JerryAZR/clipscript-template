import { AbsoluteFill } from "remotion";
import { ThemeProvider } from "../calculate-metadata/theme";
import { getEpisode } from "../episodes/registry";
import type { EpisodeProps } from "./calculate-metadata";
import { ClipRenderer } from "./ClipRenderer";
import { sharedClipComponents } from "./clips";
import { HighlightProvider } from "./HighlightContext";
import type { ClipComponent } from "./types";

export const Episode: React.FC<EpisodeProps> = ({
  episode,
  timeline,
  themeColors,
  highlightedCode,
}) => {
  if (!timeline || !themeColors || !highlightedCode) {
    throw new Error("Episode props are not computed yet");
  }

  const clipComponents: Record<string, ClipComponent> = {
    // The mapped registry type is precise per clip type; the runtime map is
    // heterogeneous, so this is the one deliberate cast
    ...(sharedClipComponents as unknown as Record<string, ClipComponent>),
    ...getEpisode(episode).clipComponents,
  };

  return (
    <ThemeProvider themeColors={themeColors}>
      <HighlightProvider highlightedCode={highlightedCode}>
        <AbsoluteFill style={{ backgroundColor: themeColors.background }}>
          <ClipRenderer timeline={timeline} clipComponents={clipComponents} />
        </AbsoluteFill>
      </HighlightProvider>
    </ThemeProvider>
  );
};
