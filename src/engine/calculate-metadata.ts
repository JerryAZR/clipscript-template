import { getThemeColors } from "@code-hike/lighter";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { themeSchema, ThemeColors } from "../calculate-metadata/theme";
import { getEpisode } from "../episodes/registry";
import { estimateDurationFrames, loadNarration } from "./narration";
import { calculateTimeline } from "./timeline";
import type { Timeline } from "./types";

/**
 * CalculateMetadataFunction does not receive the composition fps, so duration
 * estimates use this constant. Root.tsx uses it for the composition as well -
 * change it in one place.
 */
export const EPISODE_FPS = 30;

export const episodeSchema = z.object({
  episode: z.string(),
  theme: themeSchema,
});

export type EpisodeProps = {
  episode: string;
  theme: z.infer<typeof themeSchema>;
  timeline: Timeline | null;
  themeColors: ThemeColors | null;
};

export const episodeCalculateMetadata: CalculateMetadataFunction<
  EpisodeProps
> = async ({ props }) => {
  const { storyboard } = getEpisode(props.episode);
  const narration = await loadNarration(props.episode);

  const lines = narration.map((line) => ({
    ...line,
    durationFrames: estimateDurationFrames(line.text, EPISODE_FPS),
  }));

  const timeline = calculateTimeline(lines, storyboard.clips);
  const themeColors = await getThemeColors(props.theme);

  return {
    durationInFrames: timeline.totalFrames,
    props: {
      ...props,
      timeline,
      themeColors,
    },
  };
};
