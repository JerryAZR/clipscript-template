import fs from "node:fs";
import { measureAudioDuration } from "../src/engine/audio";
import { resolveCodeState } from "../src/engine/clips/code-state";
import { estimateDurationFrames, parseSubtitles } from "../src/engine/subtitles";
import { calculateTimeline } from "../src/engine/timeline";
import type { Timeline } from "../src/engine/types";
import { getEpisode } from "../src/episodes/registry";

/**
 * Node-side episode timeline loader, shared by scripts/timeline-check.ts and
 * tests/smoke. Mirrors episodeCalculateMetadata's pipeline (parse subtitles,
 * measure voiceover durations with estimates when missing, fence timeline,
 * resolve code chains) but reads files with fs instead of staticFile/fetch.
 * If frame math ever diverges from the engine, it diverges here too - one
 * place to debug.
 */
export const loadEpisodeTimeline = async (
  episode: string,
): Promise<Timeline> => {
  const { storyboard } = getEpisode(episode);
  const subtitles = parseSubtitles(
    fs.readFileSync(`public/${episode}/subtitles.toml`, "utf8"),
  );
  const lines = await Promise.all(
    subtitles.map(async (line) => {
      const mp3 = `public/${episode}/voiceover/${line.fullId}.mp3`;
      if (fs.existsSync(mp3)) {
        const seconds = await measureAudioDuration(
          new Blob([fs.readFileSync(mp3)]),
        );
        return {
          ...line,
          durationFrames: Math.max(1, Math.round(seconds * 30)),
        };
      }
      return { ...line, durationFrames: estimateDurationFrames(line.text, 30) };
    }),
  );
  const raw = calculateTimeline(lines, storyboard.clips);
  return { ...raw, clips: resolveCodeState(raw.clips) };
};
