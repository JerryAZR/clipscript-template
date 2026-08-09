import { AbsoluteFill, Img, staticFile } from "remotion";
import { rgba } from "polished";
import { ThemeProvider, useThemeColors } from "../calculate-metadata/theme";
import { getEpisode } from "../episodes/registry";
import type { EpisodeProps } from "./calculate-metadata";
import { ClipRenderer } from "./ClipRenderer";
import { sharedClipComponents } from "./clips";
import { EpisodeNameProvider } from "./EpisodeNameContext";
import { HighlightProvider } from "./HighlightContext";
import type { BackgroundDef, ClipComponent } from "./types";

const Background: React.FC<{ episode: string; background: BackgroundDef }> = ({
  episode,
  background,
}) => {
  const { src, dim = 0, saturate = 1, brightness = 1 } = background;
  const themeColors = useThemeColors();
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(`${episode}/images/${src}`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `saturate(${saturate}) brightness(${brightness})`,
        }}
      />
      {dim > 0 ? (
        // Theme-colored scrim (not black): a light source image dims toward
        // the theme background instead of a muddy gray
        <AbsoluteFill
          style={{ backgroundColor: rgba(themeColors.background, dim) }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const Episode: React.FC<EpisodeProps> = ({
  episode,
  timeline,
  themeColors,
  highlightedCode,
}) => {
  if (!timeline || !themeColors || !highlightedCode) {
    throw new Error("Episode props are not computed yet");
  }

  const module = getEpisode(episode);
  const clipComponents: Record<string, ClipComponent> = {
    // The mapped registry type is precise per clip type; the runtime map is
    // heterogeneous, so this is the one deliberate cast
    ...(sharedClipComponents as unknown as Record<string, ClipComponent>),
    ...module.clipComponents,
  };

  return (
    <ThemeProvider themeColors={themeColors}>
      <HighlightProvider highlightedCode={highlightedCode}>
        <EpisodeNameProvider name={episode}>
          <AbsoluteFill style={{ backgroundColor: themeColors.background }}>
            {module.storyboard.background ? (
              <Background
                episode={episode}
                background={module.storyboard.background}
              />
            ) : null}
            <ClipRenderer timeline={timeline} clipComponents={clipComponents} />
          </AbsoluteFill>
        </EpisodeNameProvider>
      </HighlightProvider>
    </ThemeProvider>
  );
};
