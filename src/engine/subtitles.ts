import { staticFile } from "remotion";
import { parse } from "smol-toml";
import { z } from "zod";

export type SubtitleLine = {
  fullId: string;
  text: string;
  /** Per-line term -> spoken replacement, merged last over all other layers */
  pronunciation?: Record<string, string>;
  /** false hides the line from the subtitle band (e.g. title beats) */
  subtitle?: boolean;
};

const subtitlesSchema = z.object({
  lines: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      pronunciation: z.record(z.string(), z.string()).optional(),
      subtitle: z.boolean().optional(),
    }),
  ),
});

/**
 * Rough estimate used when a line has no voiceover audio yet (silent episodes).
 * Replaced by measured mp3 durations at this same seam once TTS lands.
 */
export const ESTIMATED_CHARS_PER_SECOND = 15;

export const estimateDurationFrames = (text: string, fps: number): number =>
  Math.max(fps, Math.round((text.length / ESTIMATED_CHARS_PER_SECOND) * fps));

export const parseSubtitles = (toml: string): SubtitleLine[] => {
  const parsed = subtitlesSchema.parse(parse(toml));
  if (parsed.lines.length === 0) {
    throw new Error("subtitles.toml has no lines");
  }

  const seen = new Set<string>();
  return parsed.lines.map(({ id, text, pronunciation, subtitle }) => {
    if (seen.has(id)) {
      throw new Error(`Duplicate subtitle line id '${id}'`);
    }
    seen.add(id);
    // Ids are used verbatim - dotted namespacing ("states.why-states-1")
    // is an authoring convention, not engine semantics
    return { fullId: id, text, pronunciation, subtitle };
  });
};

export const loadSubtitles = async (
  episode: string,
): Promise<SubtitleLine[]> => {
  const response = await fetch(staticFile(`${episode}/subtitles.toml`));
  if (!response.ok) {
    throw new Error(
      `subtitles.toml not found for episode '${episode}' (HTTP ${response.status})`,
    );
  }
  return parseSubtitles(await response.text());
};
