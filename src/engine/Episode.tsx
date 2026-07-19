import { AbsoluteFill } from "remotion";
import { ThemeProvider } from "../calculate-metadata/theme";
import { getEpisode } from "../episodes/registry";
import type { EpisodeProps } from "./calculate-metadata";
import { ClipRenderer } from "./ClipRenderer";
import { sharedClipComponents } from "./clips";

export const Episode: React.FC<EpisodeProps> = ({
  episode,
  timeline,
  themeColors,
}) => {
  if (!timeline || !themeColors) {
    throw new Error("Episode props are not computed yet");
  }

  const clipComponents = {
    ...sharedClipComponents,
    ...getEpisode(episode).clipComponents,
  };

  return (
    <ThemeProvider themeColors={themeColors}>
      <AbsoluteFill style={{ backgroundColor: themeColors.background }}>
        <ClipRenderer timeline={timeline} clipComponents={clipComponents} />
      </AbsoluteFill>
    </ThemeProvider>
  );
};
