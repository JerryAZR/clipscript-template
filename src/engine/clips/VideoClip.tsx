import { Video } from "@remotion/media";
import { mix, readableColor } from "polished";
import { staticFile } from "remotion";
import { useThemeColors } from "../../calculate-metadata/theme";
import { cardRadius } from "../code-style";
import { useEpisodeName } from "../EpisodeNameContext";
import type { ClipComponent, VideoClipDef } from "../types";

export const VideoClip: ClipComponent<VideoClipDef> = ({ clip }) => {
  const themeColors = useThemeColors();
  const episode = useEpisodeName();

  if (!clip.src) {
    throw new Error(`clip '${clip.id}': video clip has no src`);
  }

  const foreground = readableColor(themeColors.background);
  const cardBackground = mix(0.04, foreground, themeColors.background);
  const cardBorder = mix(0.12, foreground, themeColors.background);

  // The clip's Sequence window already aligns playback to startFrame/endFrame;
  // trimBefore only skips into the recording itself.
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cardBackground,
        border: `1px solid ${cardBorder}`,
        borderRadius: cardRadius,
        overflow: "hidden",
      }}
    >
      <Video
        src={staticFile(`${episode}/video/${clip.src}`)}
        trimBefore={clip.startFrom ?? 0}
        playbackRate={clip.playbackRate ?? 1}
        muted={clip.muted ?? true}
        loop={clip.loop ?? false}
        objectFit="contain"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
