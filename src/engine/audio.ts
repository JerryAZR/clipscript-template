import { ALL_FORMATS, BlobSource, Input } from "mediabunny";
import { staticFile } from "remotion";
import { estimateDurationFrames, SubtitleLine } from "./subtitles";

export type ResolvedLine = SubtitleLine & {
  durationFrames: number;
  audio: string | null;
};

/** Duration of an audio blob in seconds (works in browser and Node). */
export const measureAudioDuration = async (blob: Blob): Promise<number> => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(blob),
  });
  return input.computeDuration();
};

/**
 * Resolves subtitle lines to durations: measured from the voiceover mp3 when
 * it exists (produced by scripts/tts.mts), estimated from text length when it
 * doesn't (silent episodes still render). Estimation shifts the whole
 * timeline, so missing voiceover is reported, once, not silent.
 */
export const resolveLineAudio = async (
  episode: string,
  lines: SubtitleLine[],
  fps: number,
): Promise<ResolvedLine[]> => {
  const resolved = await Promise.all(
    lines.map(async (line): Promise<ResolvedLine> => {
      const audio = `${episode}/voiceover/${line.fullId}.mp3`;
      const response = await fetch(staticFile(audio));
      if (!response.ok) {
        return {
          ...line,
          durationFrames: estimateDurationFrames(line.text, fps),
          audio: null,
        };
      }
      const seconds = await measureAudioDuration(await response.blob());
      return {
        ...line,
        durationFrames: Math.max(1, Math.round(seconds * fps)),
        audio,
      };
    }),
  );
  const estimated = resolved.filter((line) => line.audio === null);
  if (estimated.length > 0) {
    console.warn(
      `[episode '${episode}'] ${estimated.length}/${resolved.length} lines have no voiceover, durations estimated: ${estimated.map((l) => l.fullId).join(", ")}`,
    );
  }
  return resolved;
};
