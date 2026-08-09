import { getThemeColors } from "@code-hike/lighter";
import type { HighlightedCode } from "codehike/code";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { themeSchema, ThemeColors } from "../calculate-metadata/theme";
import { getEpisode } from "../episodes/registry";
import { resolveLineAudio } from "./audio";
import { resolveCodeState } from "./clips/code-state";
import { highlightCodeSteps } from "./highlight";
import { loadSubtitles } from "./subtitles";
import { calculateTimeline } from "./timeline";
import { validateStoryboard } from "./validate";
import type { CodeClipDef, Timeline } from "./types";

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
  highlightedCode: Record<string, HighlightedCode> | null;
};

export const episodeCalculateMetadata: CalculateMetadataFunction<
  EpisodeProps
> = async ({ props }) => {
  const { storyboard } = getEpisode(props.episode);
  const subtitles = await loadSubtitles(props.episode);
  const lines = await resolveLineAudio(props.episode, subtitles, EPISODE_FPS);

  const rawTimeline = calculateTimeline(lines, storyboard.clips);
  const timeline: Timeline = {
    ...rawTimeline,
    clips: resolveCodeState(rawTimeline.clips),
  };

  const codeSrcs = [
    ...new Set(
      timeline.clips
        .filter((clip) => clip.type === "code")
        .flatMap((clip) => (clip as Timeline["clips"][number] & CodeClipDef).steps),
    ),
  ];

  const [themeColors, highlightedCode] = await Promise.all([
    getThemeColors(props.theme),
    highlightCodeSteps(props.episode, codeSrcs, props.theme),
  ]);

  const lineCounts = Object.fromEntries(
    Object.entries(highlightedCode).map(([src, code]) => [
      src,
      code.code.split("\n").length,
    ]),
  );
  for (const warning of validateStoryboard({
    lines: timeline.lines,
    clips: timeline.clips,
    totalFrames: timeline.totalFrames,
    lineCounts,
  })) {
    console.warn(`[episode '${props.episode}'] ${warning}`);
  }

  return {
    durationInFrames: timeline.totalFrames,
    props: {
      ...props,
      timeline,
      themeColors,
      highlightedCode,
    },
  };
};
